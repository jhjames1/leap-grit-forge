import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { action, adminId, email, newPassword, newEmail, currentUserEmail } = await req.json()

    console.log(`Admin management action: ${action} for ${email || adminId}`)

    switch (action) {
      case 'reset_password': {
        if (!email || !newPassword) {
          throw new Error('Email and new password are required')
        }

        // Update password using admin API
        const { data, error } = await supabaseClient.auth.admin.updateUserById(
          adminId,
          { password: newPassword }
        )

        if (error) {
          console.error('Password reset error:', error)
          throw error
        }

        // Log the action
        await supabaseClient.from('user_activity_logs').insert({
          user_id: adminId,
          action: 'admin_password_reset',
          type: 'admin_management',
          details: JSON.stringify({ reset_by: currentUserEmail, target_email: email })
        })

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'change_email': {
        if (!adminId || !newEmail) {
          throw new Error('Admin ID and new email are required')
        }

        // Update email using admin API
        const { data, error } = await supabaseClient.auth.admin.updateUserById(
          adminId,
          { 
            email: newEmail,
            email_confirm: true // Auto-confirm the email for admin changes
          }
        )

        if (error) {
          console.error('Email change error:', error)
          throw error
        }

        // Log the action
        await supabaseClient.from('user_activity_logs').insert({
          user_id: adminId,
          action: 'admin_email_change',
          type: 'admin_management',
          details: JSON.stringify({ changed_by: currentUserEmail, new_email: newEmail })
        })

        return new Response(
          JSON.stringify({ success: true, message: 'Email updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_admin': {
        if (!adminId || !email) {
          throw new Error('Admin ID and email are required')
        }

        // Protection: Never allow deletion of jjames@modecommunications.net unless they're deleting themselves
        if (email === 'jjames@modecommunications.net' && currentUserEmail !== 'jjames@modecommunications.net') {
          throw new Error('Cannot delete the primary administrator')
        }

        // Check if there are other admins (prevent deleting the last admin)
        const { data: adminRoles, error: rolesError } = await supabaseClient
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')

        if (rolesError) throw rolesError

        if (adminRoles.length <= 1) {
          throw new Error('Cannot delete the last administrator')
        }

        // Remove admin role
        const { error: roleDeleteError } = await supabaseClient
          .from('user_roles')
          .delete()
          .eq('user_id', adminId)
          .eq('role', 'admin')

        if (roleDeleteError) {
          console.error('Role deletion error:', roleDeleteError)
          throw roleDeleteError
        }

        // Delete the user account entirely (this will cascade to profiles table)
        const { error: userDeleteError } = await supabaseClient.auth.admin.deleteUser(adminId)

        if (userDeleteError) {
          console.error('User deletion error:', userDeleteError)
          throw userDeleteError
        }

        // Log the action
        await supabaseClient.from('user_activity_logs').insert({
          user_id: adminId,
          action: 'admin_deleted',
          type: 'admin_management',
          details: JSON.stringify({ deleted_by: currentUserEmail, deleted_admin: email })
        })

        return new Response(
          JSON.stringify({ success: true, message: 'Administrator deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Admin management error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})