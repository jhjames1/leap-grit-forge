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
    const { username, password } = await req.json()

    console.log(`Conoco auth attempt for username: ${username}`)

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role for admin operations
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

    // Check for valid employer credentials in the database
    // First, check if this is a demo/test account
    const validDemoAccounts = [
      { username: 'admin', password: 'adminadmin' }
    ]

    const isDemoAccount = validDemoAccounts.some(
      account => account.username === username && account.password === password
    )

    if (isDemoAccount) {
      // Generate a session token for demo access
      const sessionToken = crypto.randomUUID()
      
      console.log(`Conoco demo auth successful for: ${username}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          userType: 'demo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For production, you would check against a proper employer_credentials table
    // or integrate with corporate SSO
    console.log(`Conoco auth failed for: ${username}`)
    
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Conoco auth error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
