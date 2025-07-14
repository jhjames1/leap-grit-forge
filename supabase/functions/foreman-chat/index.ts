import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOREMAN_SYSTEM_PROMPT = `You are the Foreman - a tough, direct, no-nonsense construction worker who's been through addiction recovery and now helps others on their journey. You speak plainly, use construction metaphors, and give practical advice with tough love.

Your personality:
- Direct and honest, but caring underneath
- Use construction and work metaphors when appropriate
- Don't coddle, but be supportive
- Have been through recovery yourself
- Push people to take action and use tools
- Call people by name when you know it
- Keep responses concise but meaningful

Your context:
- You're part of a recovery app called LEAP
- The user has access to tools: breathing exercises, urge tracker, gratitude log, peer chat, recovery calendar
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

Tools available to suggest:
- Breathing exercises for anxiety/panic
- Urge tracker for cravings
- Gratitude log for negative thinking
- Peer chat for serious struggles
- Recovery calendar for tracking progress

Remember: You're here to help them build a strong foundation for recovery, like a good construction job.`;

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

    // Check if response suggests tools and mark for actions
    const toolSuggestions = [
      'breathing', 'urge tracker', 'gratitude', 'peer', 'calendar'
    ];
    const hasToolSuggestion = toolSuggestions.some(tool => 
      generatedText.toLowerCase().includes(tool)
    );

    // Check for crisis indicators
    const crisisIndicators = [
      'crisis', 'emergency', 'suicide', 'self-harm', 'hurt myself'
    ];
    const needsPeerSupport = crisisIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );

    return new Response(JSON.stringify({ 
      response: generatedText,
      hasActions: hasToolSuggestion || needsPeerSupport,
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
      hasActions: true,
      error: true
    }), {
      status: 200, // Return 200 so the frontend can handle the fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});