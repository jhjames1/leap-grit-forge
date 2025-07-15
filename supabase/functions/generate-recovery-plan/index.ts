import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating recovery plan for user:', user.id);

    // Get Week 1 data
    const { data: week1Data, error: week1Error } = await supabaseClient
      .from('week1_universal_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (week1Error) {
      console.error('Error fetching Week 1 data:', week1Error);
      return new Response(JSON.stringify({ error: 'Week 1 data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!week1Data.completed_at) {
      return new Response(JSON.stringify({ error: 'Week 1 not completed yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for additional context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Prepare data for AI processing
    const recoveryData = {
      triggers: week1Data.triggers || [],
      supportTriangle: week1Data.support_triangle || {},
      coreWhy: week1Data.core_why || '',
      identityWords: week1Data.identity_words || [],
      safeSpace: week1Data.safe_space || '',
      reflection: week1Data.reflection || '',
      profile: {
        firstName: profile?.first_name || '',
        recoveryStartDate: profile?.recovery_start_date || null
      }
    };

    console.log('Processing recovery data:', { triggers: recoveryData.triggers?.length || 0, hasSupport: !!recoveryData.supportTriangle });

    // Generate recovery plan using OpenAI
    const prompt = `
You are a recovery specialist creating a personalized recovery plan. Based on the Week 1 foundation data below, create a comprehensive recovery plan that will serve as a permanent reference guide.

WEEK 1 DATA:
- Triggers: ${JSON.stringify(recoveryData.triggers)}
- Support Triangle: ${JSON.stringify(recoveryData.supportTriangle)}
- Core Why: \"${recoveryData.coreWhy}\"
- Identity Words: ${recoveryData.identityWords.join(', ')}
- Safe Space: \"${recoveryData.safeSpace}\"
- Week 1 Reflection: \"${recoveryData.reflection}\"
- Name: ${recoveryData.profile.firstName}

Create a structured recovery plan with these sections:

1. PERSONAL MISSION STATEMENT
- A personalized mission statement based on their core why and identity words
- Should be empowering and specific to their journey

2. TRIGGER MANAGEMENT STRATEGY
- Specific strategies for each identified trigger
- Include coping mechanisms and alternative responses
- Rate triggers by priority and provide action steps

3. SUPPORT NETWORK ACTIVATION
- How to effectively use their support triangle
- Scripts for reaching out in different situations
- Emergency contact protocol

4. DAILY RECOVERY PRACTICES
- Morning routines incorporating their identity words
- Evening reflection practices
- Safe space visualization techniques

5. CRISIS INTERVENTION PLAN
- Step-by-step plan for high-risk situations
- Emergency contacts and immediate actions
- Self-soothing techniques using their safe space

6. PROGRESS TRACKING SYSTEM
- How to measure recovery progress
- Weekly check-in questions
- Monthly milestone celebrations

7. LONG-TERM VISION
- 30, 60, 90-day goals based on their reflection
- How their identity words guide future decisions
- Vision board elements

Return a JSON object with this structure:
{
  "title": "My Personal Recovery Plan",
  "generatedDate": "current date",
  "sections": [
    {
      "id": "mission",
      "title": "Personal Mission Statement",
      "content": "detailed content",
      "keyPoints": ["point1", "point2", "point3"]
    },
    // ... other sections
  ],
  "quickReference": {
    "emergencyContacts": ["contact info from support triangle"],
    "identityReminders": ["identity words"],
    "coreMotivation": "core why summary"
  }
}

Make it personal, actionable, and hope-filled. Use their name and reference their specific responses throughout.
`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a compassionate recovery specialist who creates personalized, actionable recovery plans. Always be encouraging and specific.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const aiData = await openAIResponse.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response');
    }

    let recoveryPlan;
    try {
      recoveryPlan = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse recovery plan');
    }

    // Add metadata
    recoveryPlan.generatedDate = new Date().toISOString();
    recoveryPlan.userId = user.id;
    recoveryPlan.version = '1.0';

    // Save to database
    const { data: savedPlan, error: saveError } = await supabaseClient
      .from('user_recovery_plans')
      .insert({
        user_id: user.id,
        plan_content: recoveryPlan,
        is_current: true,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recovery plan:', saveError);
      throw new Error('Failed to save recovery plan');
    }

    // Mark any previous plans as not current
    await supabaseClient
      .from('user_recovery_plans')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .neq('id', savedPlan.id);

    console.log('Recovery plan generated successfully for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      plan: recoveryPlan,
      planId: savedPlan.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-recovery-plan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate recovery plan' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
