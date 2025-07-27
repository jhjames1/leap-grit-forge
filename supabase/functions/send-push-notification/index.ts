import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  data?: any;
  url?: string;
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, userIds, title, body, data, url }: PushNotificationRequest = await req.json();

    // Validate input
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target user IDs
    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or userIds must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions for target users
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscriptions found for target users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VAPID keys (in production, these should be stored as secrets)
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM-TnQV4aDOcdJZQVgQXs0xkZ_8eLQJSRXagjR1Bp5Y1lxVGMlXYNw';
    const vapidPrivateKey = 'T8sDXHOe2HKwp5kTvAWJVMq8zY9rVW1TaZDf7oALfP8';

    // Create notification payload
    const notificationPayload = {
      title,
      body,
      icon: '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png',
      badge: '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png',
      data: {
        url: url || '/',
        timestamp: Date.now(),
        ...data
      },
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    const results = [];
    
    // Send notification to each subscription
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        // Create the push notification using Web Push Protocol
        const response = await sendWebPushNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          vapidPublicKey,
          vapidPrivateKey
        );

        results.push({
          userId: subscription.user_id,
          success: response.success,
          error: response.error
        });

        // If subscription is invalid, remove it from database
        if (!response.success && (response.statusCode === 410 || response.statusCode === 404)) {
          console.log('Removing invalid subscription for user:', subscription.user_id);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', subscription.user_id);
        }

      } catch (error) {
        console.error('Error sending push notification:', error);
        results.push({
          userId: subscription.user_id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Notifications sent: ${successCount} successful, ${failureCount} failed`,
        results,
        totalSent: successCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

// Simplified Web Push implementation
async function sendWebPushNotification(
  subscription: any,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    // Extract endpoint details
    const url = new URL(subscription.endpoint);
    
    // Create VAPID headers (simplified version)
    const vapidHeaders = {
      'Authorization': `WebPush ${vapidPrivateKey}`,
      'Content-Type': 'application/octet-stream',
      'TTL': '86400' // 24 hours
    };

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: vapidHeaders,
      body: payload
    });

    if (response.ok) {
      return { success: true, statusCode: response.status };
    } else {
      return { 
        success: false, 
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

serve(handler);