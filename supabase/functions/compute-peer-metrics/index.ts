import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface MetricsData {
  peer_id: string
  month: string
  chat_completion_rate?: number
  checkin_completion_rate?: number
  avg_user_rating?: number
  avg_streak_impact?: number
  avg_response_time_seconds?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { month } = await req.json()
    const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01'

    console.log(`Computing metrics for month: ${targetMonth}`)

    // Get all active peer specialists
    const { data: specialists, error: specialistsError } = await supabase
      .from('peer_specialists')
      .select('id')
      .eq('is_active', true)

    if (specialistsError) {
      throw specialistsError
    }

    const allMetrics: MetricsData[] = []

    for (const specialist of specialists) {
      const metrics: MetricsData = {
        peer_id: specialist.id,
        month: targetMonth
      }

      // 1. Chat Completion Rate
      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          status,
          created_at,
          specialist_id
        `)
        .eq('specialist_id', specialist.id)
        .gte('created_at', targetMonth)
        .lt('created_at', new Date(new Date(targetMonth).getFullYear(), new Date(targetMonth).getMonth() + 1, 1).toISOString())

      if (chatSessions && chatSessions.length > 0) {
        const completedSessions = chatSessions.filter(s => s.status === 'ended').length
        metrics.chat_completion_rate = (completedSessions / chatSessions.length) * 100
      }

      // 2. Check-In Completion Rate
      const { data: checkins } = await supabase
        .from('peer_checkins')
        .select('id, status')
        .eq('peer_id', specialist.id)
        .gte('scheduled_at', targetMonth)
        .lt('scheduled_at', new Date(new Date(targetMonth).getFullYear(), new Date(targetMonth).getMonth() + 1, 1).toISOString())

      if (checkins && checkins.length > 0) {
        const completedCheckins = checkins.filter(c => c.status === 'completed').length
        metrics.checkin_completion_rate = (completedCheckins / checkins.length) * 100
      }

      // 3. Average User Rating
      const { data: ratings } = await supabase
        .from('peer_session_ratings')
        .select('rating')
        .eq('peer_id', specialist.id)
        .gte('created_at', targetMonth)
        .lt('created_at', new Date(new Date(targetMonth).getFullYear(), new Date(targetMonth).getMonth() + 1, 1).toISOString())

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        metrics.avg_user_rating = Math.round(avgRating * 100) / 100
      }

      // 4. Average Response Time
      const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
          content,
          created_at,
          sender_type,
          session_id,
          chat_sessions!inner(specialist_id)
        `)
        .eq('chat_sessions.specialist_id', specialist.id)
        .gte('created_at', targetMonth)
        .lt('created_at', new Date(new Date(targetMonth).getFullYear(), new Date(targetMonth).getMonth() + 1, 1).toISOString())
        .order('created_at')

      if (messages && messages.length > 0) {
        const responseTimes: number[] = []
        
        // Group messages by session
        const sessionMessages = messages.reduce((acc, msg) => {
          if (!acc[msg.session_id]) acc[msg.session_id] = []
          acc[msg.session_id].push(msg)
          return acc
        }, {} as Record<string, typeof messages>)

        // Calculate response times for each session
        Object.values(sessionMessages).forEach(sessionMsgs => {
          for (let i = 0; i < sessionMsgs.length - 1; i++) {
            const currentMsg = sessionMsgs[i]
            const nextMsg = sessionMsgs[i + 1]
            
            if (currentMsg.sender_type === 'user' && nextMsg.sender_type === 'specialist') {
              const responseTime = new Date(nextMsg.created_at).getTime() - new Date(currentMsg.created_at).getTime()
              responseTimes.push(responseTime / 1000) // Convert to seconds
            }
          }
        })

        if (responseTimes.length > 0) {
          metrics.avg_response_time_seconds = Math.round((responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) * 100) / 100
        }
      }

      // 5. Recovery Streak Impact - Calculate based on user journey completions before/after sessions
      const { data: sessionsWithUsers } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          user_id,
          created_at,
          ended_at
        `)
        .eq('specialist_id', specialist.id)
        .eq('status', 'ended')
        .gte('created_at', targetMonth)
        .lt('created_at', new Date(new Date(targetMonth).getFullYear(), new Date(targetMonth).getMonth() + 1, 1).toISOString())
        .not('ended_at', 'is', null)

      if (sessionsWithUsers && sessionsWithUsers.length > 0) {
        const streakImpacts: number[] = []

        for (const session of sessionsWithUsers) {
          const sessionDate = new Date(session.ended_at)
          
          // Count journey completions 7 days before session
          const beforeStart = new Date(sessionDate)
          beforeStart.setDate(beforeStart.getDate() - 7)
          const beforeEnd = new Date(sessionDate)
          beforeEnd.setDate(beforeEnd.getDate() - 1)

          const { data: beforeCompletions } = await supabase
            .from('user_daily_stats')
            .select('actions_completed')
            .eq('user_id', session.user_id)
            .gte('date', beforeStart.toISOString().slice(0, 10))
            .lte('date', beforeEnd.toISOString().slice(0, 10))

          // Count journey completions 7 days after session
          const afterStart = new Date(sessionDate)
          afterStart.setDate(afterStart.getDate() + 1)
          const afterEnd = new Date(sessionDate)
          afterEnd.setDate(afterEnd.getDate() + 7)

          const { data: afterCompletions } = await supabase
            .from('user_daily_stats')
            .select('actions_completed')
            .eq('user_id', session.user_id)
            .gte('date', afterStart.toISOString().slice(0, 10))
            .lte('date', afterEnd.toISOString().slice(0, 10))

          const beforeCount = beforeCompletions?.length || 0
          const afterCount = afterCompletions?.length || 0
          const impact = afterCount - beforeCount

          streakImpacts.push(impact)
        }

        if (streakImpacts.length > 0) {
          metrics.avg_streak_impact = Math.round((streakImpacts.reduce((sum, impact) => sum + impact, 0) / streakImpacts.length) * 100) / 100
        }
      }

      allMetrics.push(metrics)
    }

    // Upsert metrics into database
    for (const metrics of allMetrics) {
      const { error: upsertError } = await supabase
        .from('peer_monthly_metrics')
        .upsert(metrics, {
          onConflict: 'peer_id,month'
        })

      if (upsertError) {
        console.error('Error upserting metrics:', upsertError)
      }
    }

    console.log(`Computed metrics for ${allMetrics.length} specialists`)

    return new Response(
      JSON.stringify({
        success: true,
        metrics_computed: allMetrics.length,
        month: targetMonth
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error computing peer metrics:', error)
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})