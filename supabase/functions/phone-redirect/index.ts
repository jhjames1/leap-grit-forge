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

    console.log('Phone redirect request received');
    
    // Get the token from URL parameters or request body
    const url = new URL(req.url);
    let token = url.searchParams.get('token');
    
    if (!token && req.method === 'POST') {
      const body = await req.json();
      token = body.token;
    }

    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Looking up phone call request with token:', token.substring(0, 8) + '...');

    // Look up the phone call request using the secure token
    const { data: phoneRequest, error: requestError } = await supabase
      .from('phone_call_requests')
      .select(`
        *,
        peer_specialists (phone_number, first_name, last_name)
      `)
      .eq('request_token', token)
      .eq('status', 'accepted')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (requestError || !phoneRequest) {
      console.error('Phone request not found or invalid:', requestError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const specialist = phoneRequest.peer_specialists as any;
    
    if (!specialist?.phone_number) {
      console.error('Specialist phone number not found');
      return new Response(
        JSON.stringify({ error: 'Specialist phone number not available' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Valid phone request found, redirecting to specialist:', specialist.first_name);

    // Update the request status to indicate call has been initiated
    const { error: updateError } = await supabase
      .from('phone_call_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...phoneRequest.metadata,
          call_initiated: true,
          redirect_timestamp: new Date().toISOString()
        }
      })
      .eq('id', phoneRequest.id);

    if (updateError) {
      console.error('Error updating phone request:', updateError);
    }

    // Log the phone call activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: phoneRequest.user_id,
        action: 'phone_call_completed',
        type: 'phone_communication',
        details: JSON.stringify({
          request_id: phoneRequest.id,
          specialist_id: phoneRequest.specialist_id,
          session_id: phoneRequest.session_id,
          specialist_name: `${specialist.first_name} ${specialist.last_name}`,
          call_timestamp: new Date().toISOString()
        })
      });

    // Return the specialist's phone number for the telephony system to dial
    // This would typically be handled by your telephony provider's API
    const response = {
      success: true,
      specialist_phone: specialist.phone_number,
      specialist_name: `${specialist.first_name} ${specialist.last_name}`,
      call_duration_limit: 60, // 60 minutes max call duration
      privacy_notice: 'Phone numbers are never shared between parties'
    };

    console.log('Phone redirect successful');

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in phone redirect:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})