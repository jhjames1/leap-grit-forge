import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@4.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InvitationRequest {
  specialistId: string;
  adminId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { specialistId, adminId }: InvitationRequest = await req.json();

    console.log("Processing invitation for specialist:", specialistId);

    // Get specialist details
    const { data: specialist, error: specialistError } = await supabase
      .from("peer_specialists")
      .select("*, user_id")
      .eq("id", specialistId)
      .single();

    if (specialistError || !specialist) {
      console.error("Error fetching specialist:", specialistError);
      return new Response(
        JSON.stringify({ error: "Specialist not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from auth
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(specialist.user_id);

    if (userError || !user.user?.email) {
      console.error("Error fetching user email:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate invitation token and temporary password
    const { data: tokenData, error: tokenError } = await supabase
      .rpc("generate_invitation_token");

    const { data: tempPassword, error: passwordError } = await supabase
      .rpc("generate_temporary_password");

    if (tokenError || passwordError) {
      console.error("Error generating token/password:", tokenError, passwordError);
      return new Response(
        JSON.stringify({ error: "Failed to generate invitation credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the temporary password
    const encoder = new TextEncoder();
    const data = encoder.encode(tempPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Update specialist with invitation details
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const { error: updateError } = await supabase
      .from("peer_specialists")
      .update({
        invitation_token: tokenData,
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: expiresAt.toISOString(),
        temporary_password_hash: hashedPassword,
        invited_by_admin_id: adminId,
        is_invitation_accepted: false,
        must_change_password: true
      })
      .eq("id", specialistId);

    if (updateError) {
      console.error("Error updating specialist:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update specialist invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create verification URL
    const verificationUrl = `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/specialist/verify?token=${tokenData}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "LEAP Recovery <noreply@leap.com>",
      to: [user.user.email],
      subject: "You've been invited to join LEAP as a Peer Specialist",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to LEAP Recovery</h1>
          
          <p>Hello ${specialist.first_name},</p>
          
          <p>You have been invited to join LEAP as a Peer Specialist. We're excited to have you as part of our recovery support community.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${user.user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 4px; font-size: 16px; font-weight: bold;">${tempPassword}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Account & Access Portal
            </a>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>You must verify your account within 7 days</li>
            <li>You'll be required to change your password on first login</li>
            <li>This invitation link expires on ${expiresAt.toLocaleDateString()}</li>
          </ul>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The LEAP Recovery Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        emailId: emailResponse.data?.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-specialist-invitation function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);