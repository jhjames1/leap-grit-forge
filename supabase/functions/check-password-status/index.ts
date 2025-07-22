import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

interface CheckPasswordStatusResponse {
  must_change_password: boolean;
  specialist_id: string | null;
  error?: string;
}

// Create a Supabase client with the auth context of the logged in user
const supabaseClient = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')!
  
  return createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    }
  )
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = await supabaseClient(req)
    
    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ 
          must_change_password: false, 
          specialist_id: null, 
          error: 'Not authenticated' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the specialist profile for the current user
    const { data: specialist, error: specialistError } = await supabase
      .from('peer_specialists')
      .select('id, must_change_password')
      .eq('user_id', session.user.id)
      .eq('is_verified', true)
      .eq('is_active', true)
      .single()

    if (specialistError) {
      return new Response(
        JSON.stringify({ 
          must_change_password: false, 
          specialist_id: null, 
          error: 'Specialist profile not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return the password status
    const response: CheckPasswordStatusResponse = {
      must_change_password: specialist.must_change_password || false,
      specialist_id: specialist.id
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        must_change_password: false, 
        specialist_id: null, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

Deno.serve(handler)