import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface BanUserRequest {
  action: 'ban_user'
  userId: string
  banDuration?: number // hours, if not provided = permanent ban
  reason?: string
}

interface UnbanUserRequest {
  action: 'unban_user'
  userId: string
}

interface GetLoginHistoryRequest {
  action: 'get_login_history'
  userId: string
  limit?: number
}

interface ResetPasswordRequest {
  action: 'reset_password'
  userId: string
  userEmail: string
}

type UserManagementRequest = BanUserRequest | UnbanUserRequest | GetLoginHistoryRequest | ResetPasswordRequest

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!adminCheck) {
      throw new Error('Admin permissions required')
    }

    const body: UserManagementRequest = await req.json()
    console.log('User management request:', { action: body.action, userId: body.userId })

    switch (body.action) {
      case 'ban_user': {
        const { userId, banDuration, reason } = body

        // Calculate ban end date
        let banUntil: string
        if (banDuration && banDuration > 0) {
          // Temporary ban
          const banEndDate = new Date()
          banEndDate.setHours(banEndDate.getHours() + banDuration)
          banUntil = banEndDate.toISOString()
        } else {
          // Permanent ban - set to far future date
          banUntil = '2099-12-31T23:59:59.999Z'
        }

        // Ban the user using Supabase Admin API
        const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
          banned_until: banUntil
        })

        if (banError) {
          throw new Error(`Failed to ban user: ${banError.message}`)
        }

        // Log the ban action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action: 'ban_user',
            type: 'admin_management',
            details: JSON.stringify({
              target_user_id: userId,
              ban_duration: banDuration || 'permanent',
              reason: reason || 'No reason provided',
              banned_until: banUntil
            })
          })

        console.log('User banned successfully:', { userId, banUntil })
        return new Response(JSON.stringify({ 
          success: true, 
          message: banDuration ? `User banned for ${banDuration} hours` : 'User permanently banned',
          banned_until: banUntil 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'unban_user': {
        const { userId } = body

        // Unban the user
        const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
          banned_until: null
        })

        if (unbanError) {
          throw new Error(`Failed to unban user: ${unbanError.message}`)
        }

        // Log the unban action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action: 'unban_user',
            type: 'admin_management',
            details: JSON.stringify({
              target_user_id: userId
            })
          })

        console.log('User unbanned successfully:', { userId })
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'User unbanned successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_login_history': {
        const { userId, limit = 50 } = body

        // Get login history for the user
        const { data: loginHistory, error: historyError } = await supabase
          .from('user_login_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (historyError) {
          throw new Error(`Failed to fetch login history: ${historyError.message}`)
        }

        console.log('Login history fetched:', { userId, count: loginHistory?.length })
        return new Response(JSON.stringify({ 
          success: true, 
          data: loginHistory || [] 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'reset_password': {
        const { userId, userEmail } = body

        // Generate a secure temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase()

        // Reset the user's password using Supabase Admin API
        const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword
        })

        if (resetError) {
          throw new Error(`Failed to reset password: ${resetError.message}`)
        }

        // Log the password reset action
        await supabase
          .from('user_activity_logs')
          .insert({
            user_id: user.id,
            action: 'reset_password',
            type: 'admin_management',
            details: JSON.stringify({
              target_user_id: userId,
              target_user_email: userEmail,
              reset_by_admin: user.id
            })
          })

        console.log('Password reset successfully:', { userId, userEmail })
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Password reset successfully',
          temporary_password: tempPassword
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('User management error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})