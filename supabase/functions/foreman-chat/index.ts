import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOREMAN_SYSTEM_PROMPT = `You are the Foreman - a tough, direct person who's been through addiction recovery and now helps others on their journey. You speak plainly and give practical advice with tough love.

Your personality:
- Direct and honest, but caring underneath
- Speak in plain, straightforward language most of the time
- Only use work metaphors when they genuinely help explain a concept
- Don't coddle, but be supportive
- Have been through recovery yourself
- Push people to take action and use tools
- Call people by name when you know it
- Keep responses concise but meaningful
- Focus on the person's actual situation rather than forcing metaphors

Your context:
- You're part of a recovery app called LEAP
- The user has access to tools: breathing exercises, urge tracker, gratitude log, peer chat, recovery calendar, recovery journey
- You can suggest these tools when appropriate
- If someone seems in crisis, suggest talking to a peer specialist
- You remember the conversation context

Response guidelines:
- Keep responses under 100 words typically
- Be conversational and natural
- Ask follow-up questions to understand their situation
- Suggest specific tools when relevant
- Use the user's name when you know it
- If they seem to be struggling significantly, suggest peer support

Tools available to suggest (respond with EXACT tool names in your response):
- "breathing" for anxiety/panic attacks
- "urge" for cravings and urges
- "gratitude" for negative thinking or depression
- "peer" for serious struggles or crisis
- "calendar" for tracking recovery progress
- "journey" for milestone tracking
- "toolbox" for full tool access

IMPORTANT: When recommending tools, use the EXACT words above in your response. For example: "Try the breathing exercise" or "Use the gratitude log" or "Check your journey progress".

Remember: You're here to help them stay strong in their recovery journey and take practical steps forward.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, userProfile } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Build the conversation context
    const messages = [
      { 
        role: 'system', 
        content: FOREMAN_SYSTEM_PROMPT + 
          (userProfile?.firstName ? `\n\nThe user's name is ${userProfile.firstName}.` : '') +
          (userProfile?.recoveryStartDate ? `\n\nThey started recovery on ${userProfile.recoveryStartDate}.` : '')
      }
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory?.slice(-10) || [];
    recentHistory.forEach((msg: any) => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Analyze response for specific tool recommendations
    const lowerResponse = generatedText.toLowerCase();
    const recommendedTools = [];
    
    if (lowerResponse.includes('breathing')) recommendedTools.push('breathing');
    if (lowerResponse.includes('urge')) recommendedTools.push('urge');
    if (lowerResponse.includes('gratitude')) recommendedTools.push('gratitude');
    if (lowerResponse.includes('peer')) recommendedTools.push('peer');
    if (lowerResponse.includes('calendar')) recommendedTools.push('calendar');
    if (lowerResponse.includes('journey')) recommendedTools.push('journey');
    if (lowerResponse.includes('toolbox')) recommendedTools.push('toolbox');

    // Check for crisis indicators
    const crisisIndicators = [
      'crisis', 'emergency', 'suicide', 'self-harm', 'hurt myself'
    ];
    const needsPeerSupport = crisisIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );

    // Always include peer option for crisis
    if (needsPeerSupport && !recommendedTools.includes('peer')) {
      recommendedTools.push('peer');
    }

    return new Response(JSON.stringify({ 
      response: generatedText,
      recommendedTools,
      hasActions: recommendedTools.length > 0,
      needsPeerSupport
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in foreman-chat function:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponses = [
      "I'm having trouble connecting right now. Can you tell me what's going on?",
      "Something's not working on my end. What's on your mind?",
      "Technical difficulties here. Talk to me - what's happening?",
      "I'm having system issues. What brought you here today?"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      recommendedTools: ['peer'],
      hasActions: true,
      error: true
    }), {
      status: 200, // Return 200 so the frontend can handle the fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});