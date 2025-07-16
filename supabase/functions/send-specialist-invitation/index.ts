import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  specialistId?: string;
  adminId: string;
  // For creating new specialists
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  specialties?: string[];
  years_experience?: number;
  avatar_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function called successfully");
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: InvitationRequest = await req.json();
    console.log("Request data received:", requestData);
    
    const { specialistId, adminId, email, first_name, last_name, bio, specialties, years_experience, avatar_url } = requestData;

    let specialist: any;
    let userEmail: string;

    // Check if this is creating a new specialist or resending invitation
    if (specialistId) {
      // Resending invitation to existing specialist
      console.log("Processing invitation resend for specialist:", specialistId);

      // Get specialist details
      const { data: existingSpecialist, error: specialistError } = await supabase
        .from("peer_specialists")
        .select("*, user_id")
        .eq("id", specialistId)
        .single();

      if (specialistError || !existingSpecialist) {
        console.error("Error fetching specialist:", specialistError);
        return new Response(
          JSON.stringify({ error: "Specialist not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user email from auth
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(existingSpecialist.user_id);

      if (userError || !user.user?.email) {
        console.error("Error fetching user email:", userError);
        return new Response(
          JSON.stringify({ error: "User email not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      specialist = existingSpecialist;
      userEmail = user.user.email;
    } else {
      // Creating new specialist
      if (!email || !first_name || !last_name) {
        return new Response(
          JSON.stringify({ error: "Email, first name, and last name are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Creating new specialist for email:", email);

      // Check if user already exists first
      const { data: existingUsers } = await supabase
        .rpc("find_user_by_email", { user_email: email });

      let authData;
      
      if (existingUsers && existingUsers.length > 0) {
        // User already exists, use the existing user
        const existingUser = existingUsers[0];
        authData = { user: { id: existingUser.user_id } };
        console.log("Using existing user:", existingUser.user_id);
      } else {
        // Create new auth user
        const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name
          }
        });

        if (authError) {
          console.error("Error creating auth user:", authError);
          return new Response(
            JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        authData = newAuthData;
      }

      // Check if specialist profile already exists
      const { data: existingSpecialist } = await supabase
        .from("peer_specialists")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (existingSpecialist) {
        // Update existing specialist profile
        const { data: updatedSpecialist, error: updateError } = await supabase
          .from("peer_specialists")
          .update({
            first_name,
            last_name,
            bio: bio || null,
            specialties: specialties || [],
            years_experience: years_experience || 0,
            avatar_url: avatar_url || null,
            is_active: true,
            invited_by_admin_id: adminId
          })
          .eq("user_id", authData.user.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating specialist profile:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update specialist profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        specialist = updatedSpecialist;
        console.log("Updated existing specialist profile:", specialist.id);
      } else {
        // Create new specialist profile
        const { data: specialistData, error: specialistError } = await supabase
          .from("peer_specialists")
          .insert({
            user_id: authData.user.id,
            first_name,
            last_name,
            bio: bio || null,
            specialties: specialties || [],
            years_experience: years_experience || 0,
            avatar_url: avatar_url || null,
            is_verified: false,
            is_active: true,
            invited_by_admin_id: adminId
          })
          .select()
          .single();

        if (specialistError) {
          console.error("Error creating specialist profile:", specialistError);
          return new Response(
            JSON.stringify({ error: "Failed to create specialist profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        specialist = specialistData;
        console.log("Created new specialist profile:", specialist.id);
      }

      userEmail = email;
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
      .eq("id", specialist.id);

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
    console.log("Attempting to send email to:", userEmail);
    
    let emailSuccess = false;
    let emailError = null;
    
    try {
      const emailResponse = await resend.emails.send({
        from: "LEAP Recovery <onboarding@resend.dev>",
        to: [userEmail],
        subject: "You've been invited to join LEAP as a Peer Specialist",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Welcome to LEAP Recovery</h1>
            
            <p>Hello ${specialist.first_name},</p>
            
            <p>You have been invited to join LEAP as a Peer Specialist. We're excited to have you as part of our recovery support community.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
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

      console.log("Email send response:", emailResponse);

      if (emailResponse.error) {
        console.error("Resend API error:", emailResponse.error);
        emailError = emailResponse.error;
      } else {
        console.log("Invitation sent successfully:", emailResponse.data);
        emailSuccess = true;
      }

    } catch (error) {
      console.error("Error sending email:", error);
      emailError = error;
    }

    // Always return success if specialist was created, regardless of email status
    const responseMessage = emailSuccess 
      ? "Specialist created and invitation email sent successfully"
      : `Specialist created successfully, but email could not be sent: ${emailError?.message || emailError}`;
    
    console.log("Final response:", responseMessage);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        specialistId: specialist.id,
        emailSent: emailSuccess,
        emailError: emailError ? String(emailError) : null
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