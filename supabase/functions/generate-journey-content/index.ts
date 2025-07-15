import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOCUS_AREAS = [
  'Craving Control',
  'Connection Boost', 
  'Routine Builder',
  'Toolbox Mastery',
  'Accountability Path'
];

const JOURNEY_STAGES = [
  'Just Starting Out',
  'A Few Weeks In',
  'A Few Months Strong',
  'Feeling Steady',
  'Restarting After a Pause'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, focusArea, journeyStage } = await req.json();
    
    if (action === 'generate-journeys') {
      console.log('Generating complete 90-day journeys for all focus areas...');
      
      const allJourneys = [];
      
      for (const area of FOCUS_AREAS) {
        console.log(`Generating journey for: ${area}`);
        
        const journeyPrompt = `Generate a complete 90-day addiction recovery journey focused on "${area}". 

Structure the response as a JSON object with:
- journey_name: string (e.g., "90-Day Craving Control Journey")
- focus_area: string (exactly "${area}")
- days: array of 90 day objects, each with:
  - day: number (1-90)
  - title: string (engaging daily focus)
  - content: string (detailed guidance, exercises, reflections)
  - activity: string (specific actionable task)
  - reflection: string (thought-provoking question)
  - tips: array of 3-5 practical tips
  - duration: string (estimated time commitment)

Key requirements:
- Days 1-7 should be universal foundation building (regardless of focus area)
- Days 8-90 should be specifically tailored to ${area}
- Progressive difficulty and depth
- Include specific CBT techniques, mindfulness practices, and practical tools
- Each day should build on previous days
- Include relapse prevention strategies
- Mix of education, reflection, and action

Focus on making each day practical, actionable, and supportive for someone in recovery.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert addiction recovery counselor and content creator. Generate comprehensive, evidence-based recovery journey content in valid JSON format.'
              },
              {
                role: 'user',
                content: journeyPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        try {
          const journeyData = JSON.parse(generatedContent);
          allJourneys.push(journeyData);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (parseError) {
          console.error(`Failed to parse journey for ${area}:`, parseError);
          console.error('Raw content:', generatedContent);
        }
      }
      
      return new Response(JSON.stringify({ journeys: allJourneys }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'generate-phase-modifiers') {
      console.log('Generating phase modifiers for all journey stages...');
      
      const allModifiers = [];
      
      for (const stage of JOURNEY_STAGES) {
        console.log(`Generating modifier for: ${stage}`);
        
        const modifierPrompt = `Generate a phase modifier for the journey stage "${stage}" in addiction recovery.

Structure the response as a JSON object with:
- phase_name: string (descriptive name for this phase)
- journey_stage: string (exactly "${stage}")
- tone: string (appropriate emotional tone for this stage)
- pacing: string (how fast/slow content should be delivered)
- extras: object with additional phase-specific elements like:
  - focus_keywords: array of key themes
  - support_level: string (how much support/encouragement needed)
  - challenge_level: string (appropriate difficulty level)
  - common_struggles: array of typical challenges in this stage
  - motivation_style: string (how to keep them motivated)

Consider the psychological and emotional needs of someone in the "${stage}" phase of recovery. Make it supportive, realistic, and appropriately challenging.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert addiction recovery counselor. Generate phase modifiers that adapt content to different stages of recovery in valid JSON format.'
              },
              {
                role: 'user',
                content: modifierPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        try {
          const modifierData = JSON.parse(generatedContent);
          allModifiers.push(modifierData);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (parseError) {
          console.error(`Failed to parse modifier for ${stage}:`, parseError);
          console.error('Raw content:', generatedContent);
        }
      }
      
      return new Response(JSON.stringify({ modifiers: allModifiers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in generate-journey-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});