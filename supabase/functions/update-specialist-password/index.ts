import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdatePasswordRequest {
  userId: string;
  newPassword: string;
  adminId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("update-specialist-password function called");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: UpdatePasswordRequest = await req.json();
    console.log("Request data received:", { userId: requestData.userId, adminId: requestData.adminId });
    
    const { userId, newPassword, adminId } = requestData;

    if (!userId || !newPassword || !adminId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: userId, newPassword, adminId" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the requesting user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin', { _user_id: adminId });

    if (adminError || !adminCheck) {
      console.error("Admin verification failed:", adminError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Admin privileges required" 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the target user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using the admin API
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        email_confirm: true // Ensure email is confirmed
      }
    );

    if (updateError) {
      console.error("Password update failed:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Password update failed: ${updateError.message}` 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Password updated successfully for user:", userId);

    // Log the admin action
    const { error: logError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: adminId,
        action: 'update_specialist_password',
        type: 'admin_management',
        details: JSON.stringify({
          target_user_id: userId,
          action_type: 'manual_password_update'
        })
      });

    if (logError) {
      console.error("Failed to log admin action:", logError);
      // Don't fail the request for logging errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in update-specialist-password function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);