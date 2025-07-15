import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !roles?.some(r => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action } = await req.json();

    if (action === 'import-journeys') {
      console.log('Starting journey import process...');
      
      // Call the generation function
      const generateResponse = await supabase.functions.invoke('generate-journey-content', {
        body: { action: 'generate-journeys' }
      });

      if (generateResponse.error) {
        throw new Error(`Generation failed: ${generateResponse.error.message}`);
      }

      const { journeys } = generateResponse.data;
      
      if (!journeys || journeys.length === 0) {
        throw new Error('No journeys generated');
      }

      console.log(`Generated ${journeys.length} journeys, importing to database...`);
      
      // Import journeys to database
      const insertResults = [];
      
      for (const journey of journeys) {
        const { data, error } = await supabase
          .from('ai_generated_journeys')
          .insert({
            journey_name: journey.journey_name,
            focus_area: journey.focus_area,
            days: journey.days,
            is_active: true,
            version: 1
          })
          .select();

        if (error) {
          console.error(`Failed to import journey ${journey.focus_area}:`, error);
          insertResults.push({ focus_area: journey.focus_area, success: false, error: error.message });
        } else {
          console.log(`Successfully imported journey: ${journey.focus_area}`);
          insertResults.push({ focus_area: journey.focus_area, success: true, id: data[0].id });
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Journey import completed',
        results: insertResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import-phase-modifiers') {
      console.log('Starting phase modifier import process...');
      
      // Call the generation function
      const generateResponse = await supabase.functions.invoke('generate-journey-content', {
        body: { action: 'generate-phase-modifiers' }
      });

      if (generateResponse.error) {
        throw new Error(`Generation failed: ${generateResponse.error.message}`);
      }

      const { modifiers } = generateResponse.data;
      
      if (!modifiers || modifiers.length === 0) {
        throw new Error('No phase modifiers generated');
      }

      console.log(`Generated ${modifiers.length} phase modifiers, importing to database...`);
      
      // Import modifiers to database
      const insertResults = [];
      
      for (const modifier of modifiers) {
        const { data, error } = await supabase
          .from('ai_phase_modifiers')
          .insert({
            phase_name: modifier.phase_name,
            journey_stage: modifier.journey_stage,
            tone: modifier.tone,
            pacing: modifier.pacing,
            extras: modifier.extras,
            is_active: true
          })
          .select();

        if (error) {
          console.error(`Failed to import modifier ${modifier.journey_stage}:`, error);
          insertResults.push({ journey_stage: modifier.journey_stage, success: false, error: error.message });
        } else {
          console.log(`Successfully imported modifier: ${modifier.journey_stage}`);
          insertResults.push({ journey_stage: modifier.journey_stage, success: true, id: data[0].id });
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Phase modifier import completed',
        results: insertResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import-all') {
      console.log('Starting full import process...');
      
      // Import journeys first
      const journeyResponse = await supabase.functions.invoke('admin-import-journeys', {
        body: { action: 'import-journeys' }
      });

      // Import phase modifiers
      const modifierResponse = await supabase.functions.invoke('admin-import-journeys', {
        body: { action: 'import-phase-modifiers' }
      });

      return new Response(JSON.stringify({ 
        message: 'Full import completed',
        journeys: journeyResponse.data,
        modifiers: modifierResponse.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-import-journeys function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});