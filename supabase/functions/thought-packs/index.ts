import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5"

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    const url = new URL(req.url)
    const theme = url.searchParams.get('theme') || 'base'
    const isToday = url.pathname.includes('/today')

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      // If requesting today's pack, get the base pack (for daily fresh content)
      // In a real app, you'd rotate through different packs based on date
      const targetTheme = isToday ? 'base' : theme

      // Get the thought pack
      const { data: pack, error: packError } = await supabase
        .from('thought_packs')
        .select('*')
        .eq('theme', targetTheme)
        .eq('is_active', true)
        .single()

      if (packError || !pack) {
        return new Response(JSON.stringify({ error: 'Pack not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get thought items for this pack
      const { data: items, error: itemsError } = await supabase
        .from('thought_items')
        .select('*')
        .eq('pack_id', pack.id)
        .order('created_at', { ascending: false })
        .limit(8) // Limit to 8 items per pack

      if (itemsError) {
        return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Shuffle the items for daily variety
      const shuffledItems = items.sort(() => Math.random() - 0.5)

      return new Response(JSON.stringify({
        pack: {
          id: pack.id,
          title: pack.title,
          description: pack.description,
          theme: pack.theme,
          unlock_requirement: pack.unlock_requirement,
        },
        items: shuffledItems.map(item => ({
          id: item.id,
          text: item.text,
          is_distortion: item.is_distortion,
          category: item.category,
          difficulty: item.difficulty,
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      // Save game session
      const { pack_id, score, total_items, correct_items, coins_earned } = await req.json()

      // Insert game session
      const { data: session, error: sessionError } = await supabase
        .from('cbt_game_sessions')
        .insert({
          user_id: user.id,
          pack_id,
          score,
          total_items,
          correct_items,
          coins_earned,
        })
        .select()
        .single()

      if (sessionError) {
        return new Response(JSON.stringify({ error: 'Failed to save session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Update or create streak record
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: existingStreak, error: streakError } = await supabase
        .from('cbt_game_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (streakError || !existingStreak) {
        // Create new streak
        const { error: createError } = await supabase
          .from('cbt_game_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_played_date: today,
          })

        if (createError) {
          console.error('Error creating streak:', createError)
        }
      } else {
        // Update existing streak
        let newCurrentStreak = existingStreak.current_streak
        let newLongestStreak = existingStreak.longest_streak

        if (existingStreak.last_played_date === yesterday) {
          // Continue streak
          newCurrentStreak += 1
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak)
        } else if (existingStreak.last_played_date !== today) {
          // Break streak or new day
          newCurrentStreak = 1
        }

        const { error: updateError } = await supabase
          .from('cbt_game_streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_played_date: today,
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating streak:', updateError)
        }
      }

      return new Response(JSON.stringify({ 
        session,
        message: 'Game session saved successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in thought-packs function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})