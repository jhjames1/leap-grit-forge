import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Running phone request cleanup...');

    // Find all expired phone call requests that are still pending
    const { data: expiredRequests, error: findError } = await supabase
      .from('phone_call_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (findError) {
      console.error('Error finding expired requests:', findError);
      throw findError;
    }

    console.log(`Found ${expiredRequests?.length || 0} expired phone requests`);

    if (expiredRequests && expiredRequests.length > 0) {
      // Update expired requests to 'expired' status
      const { error: updateError } = await supabase
        .from('phone_call_requests')
        .update({
          status: 'expired',
          responded_at: new Date().toISOString(),
          metadata: {
            expired_by: 'cleanup_function',
            expired_at: new Date().toISOString()
          }
        })
        .in('id', expiredRequests.map(req => req.id));

      if (updateError) {
        console.error('Error updating expired requests:', updateError);
        throw updateError;
      }

      // Send system messages to notify users about expired requests
      for (const request of expiredRequests) {
        await supabase
          .from('chat_messages')
          .insert({
            session_id: request.session_id,
            sender_id: request.user_id, // System message as if from user
            sender_type: 'system',
            message_type: 'system',
            content: 'Phone call request has expired. You can continue chatting normally.',
            metadata: {
              phone_request_id: request.id,
              call_status: 'expired'
            }
          });
      }

      console.log(`Successfully expired ${expiredRequests.length} phone requests`);
    }

    // Also clean up very old completed/declined requests (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: oldRequests, error: oldError } = await supabase
      .from('phone_call_requests')
      .select('id')
      .in('status', ['completed', 'declined', 'expired'])
      .lt('created_at', oneDayAgo);

    if (!oldError && oldRequests && oldRequests.length > 0) {
      const { error: deleteError } = await supabase
        .from('phone_call_requests')
        .delete()
        .in('id', oldRequests.map(req => req.id));

      if (!deleteError) {
        console.log(`Cleaned up ${oldRequests.length} old phone requests`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredRequests?.length || 0,
        cleaned: oldRequests?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in phone request cleanup:', error);
    return new Response(
      JSON.stringify({ error: 'Cleanup failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})