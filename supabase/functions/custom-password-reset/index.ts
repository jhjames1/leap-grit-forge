import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'send_code' | 'verify_code' | 'reset_password';
  email?: string;
  code?: string;
  newPassword?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Create admin Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, code, newPassword }: RequestBody = await req.json();

    switch (action) {
      case 'send_code': {
        if (!email) {
          throw new Error('Email is required');
        }

        // Check if user exists
        const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();
        if (findError) {
          throw new Error('Failed to check user existence');
        }

        const userExists = users.users.some(user => user.email === email);
        if (!userExists) {
          throw new Error('No account found with this email address');
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Clean up expired codes
        await supabaseAdmin
          .from('password_reset_codes')
          .delete()
          .lt('expires_at', new Date().toISOString());

        // Store the code
        const { error: insertError } = await supabaseAdmin
          .from('password_reset_codes')
          .insert({
            email,
            code: resetCode,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
          });

        if (insertError) {
          throw new Error('Failed to store reset code');
        }

        // Send email
        const emailResult = await resend.emails.send({
          from: "LEAP Support <noreply@resend.dev>",
          to: [email],
          subject: "Your Password Reset Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Password Reset Code</h1>
              <p>You requested a password reset for your LEAP account.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h2 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 4px;">${resetCode}</h2>
              </div>
              <p>Enter this code in the app to reset your password. This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Best regards,<br>The LEAP Team</p>
            </div>
          `,
        });

        console.log('Email sent:', emailResult);

        return new Response(
          JSON.stringify({ success: true, message: 'Reset code sent to your email' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'verify_code': {
        if (!email || !code) {
          throw new Error('Email and code are required');
        }

        // Find and verify the code
        const { data: codeRecord, error: findError } = await supabaseAdmin
          .from('password_reset_codes')
          .select('*')
          .eq('email', email)
          .eq('code', code)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (findError || !codeRecord) {
          throw new Error('Invalid or expired code');
        }

        // Mark code as used
        await supabaseAdmin
          .from('password_reset_codes')
          .update({ used: true })
          .eq('id', codeRecord.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Code verified successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'reset_password': {
        if (!email || !code || !newPassword) {
          throw new Error('Email, code, and new password are required');
        }

        // Verify the code one more time
        const { data: codeRecord, error: findError } = await supabaseAdmin
          .from('password_reset_codes')
          .select('*')
          .eq('email', email)
          .eq('code', code)
          .eq('used', true) // Should be marked as used from verify step
          .gt('expires_at', new Date().toISOString())
          .single();

        if (findError || !codeRecord) {
          throw new Error('Invalid or expired code');
        }

        // Find the user
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) {
          throw new Error('Failed to find user');
        }

        const user = users.users.find(u => u.email === email);
        if (!user) {
          throw new Error('User not found');
        }

        // Update the password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          throw new Error('Failed to update password');
        }

        // Clean up the used code
        await supabaseAdmin
          .from('password_reset_codes')
          .delete()
          .eq('id', codeRecord.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in custom-password-reset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);