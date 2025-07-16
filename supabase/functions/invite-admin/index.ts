import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { corsHeaders } from "../_shared/cors.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InviteAdminRequest {
  email: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, inviterName = "Administrator" }: InviteAdminRequest = await req.json();

    console.log("Processing admin invitation for:", email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .rpc('find_user_by_email', { user_email: email })
      .single();

    let emailSubject: string;
    let emailContent: string;
    
    if (existingUser) {
      // User exists, check if they're already an admin
      if (existingUser.is_admin) {
        return new Response(
          JSON.stringify({ error: "User is already an administrator" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }

      // Add admin role to existing user
      const { data: roleResult } = await supabase
        .rpc('add_admin_role', { target_user_id: existingUser.user_id })
        .single();

      if (!roleResult.success) {
        return new Response(
          JSON.stringify({ error: roleResult.error }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }

      emailSubject = "You've been granted administrator access";
      emailContent = `
        <h2>Administrator Access Granted</h2>
        <p>Hello,</p>
        <p>You have been granted administrator access to the LEAP Recovery Platform by ${inviterName}.</p>
        <p>You can now access the admin panel using your existing account credentials.</p>
        <p><strong>What you can do as an administrator:</strong></p>
        <ul>
          <li>Manage peer specialists</li>
          <li>View user analytics and reports</li>
          <li>Manage motivational content</li>
          <li>Access system security features</li>
          <li>Manage other administrators</li>
        </ul>
        <p>If you have any questions about your new administrator privileges, please contact the person who granted you access.</p>
        <p>Best regards,<br>The LEAP Recovery Platform Team</p>
      `;
    } else {
      // User doesn't exist, send invitation to create account
      emailSubject = "You've been invited to become an administrator";
      emailContent = `
        <h2>Administrator Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to become an administrator of the LEAP Recovery Platform by ${inviterName}.</p>
        <p>To get started, you'll need to create an account first:</p>
        <ol>
          <li>Visit the platform and create a new account using this email address</li>
          <li>Once your account is created, contact ${inviterName} to have administrator privileges granted</li>
        </ol>
        <p><strong>As an administrator, you'll be able to:</strong></p>
        <ul>
          <li>Manage peer specialists</li>
          <li>View user analytics and reports</li>
          <li>Manage motivational content</li>
          <li>Access system security features</li>
          <li>Manage other administrators</li>
        </ul>
        <p>If you have any questions about this invitation, please contact ${inviterName}.</p>
        <p>Best regards,<br>The LEAP Recovery Platform Team</p>
      `;
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "LEAP Recovery Platform <admin@leap-recovery.com>",
      to: [email],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingUser ? "Admin role granted and notification sent" : "Invitation sent",
        userExists: !!existingUser 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error("Error in invite-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);