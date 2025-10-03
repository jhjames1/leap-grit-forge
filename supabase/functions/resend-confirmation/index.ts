import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResendRequest {
  email: string;
  adminUserId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Resend confirmation request received')

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, adminUserId }: ResendRequest = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    console.log('Attempting to resend confirmation to:', email)

    // Find the user by email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (findError) {
      console.error('Error finding users:', findError)
      throw new Error('Failed to find user')
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      throw new Error('User not found')
    }

    console.log('Found user:', user.id, 'Email confirmed:', user.email_confirmed_at)

    // Check if email is already confirmed
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email is already confirmed',
          confirmedAt: user.email_confirmed_at 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Generate and send new confirmation email
    const { error: resendError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://localhost:3000')}/confirm`
      }
    })

    if (resendError) {
      console.error('Error resending confirmation:', resendError)
      throw new Error(`Failed to resend confirmation: ${resendError.message}`)
    }

    // Log the action if admin user provided
    if (adminUserId) {
      const { error: logError } = await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: adminUserId,
          action: 'resend_email_confirmation',
          type: 'admin_management',
          details: JSON.stringify({ target_email: email, target_user_id: user.id })
        })

      if (logError) {
        console.error('Error logging action:', logError)
      }
    }

    console.log('Confirmation email resent successfully to:', email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Confirmation email resent to ${email}`,
        userId: user.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )

  } catch (error) {
    console.error('Error in resend-confirmation function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})