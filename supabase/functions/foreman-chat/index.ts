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
- ALWAYS call people by name when you know it - it shows you see them as a person
- Keep responses concise but meaningful
- Focus on the person's actual situation rather than forcing metaphors
- Reference previous conversations naturally to show continuity and that you remember them
- Remember their struggles and check on specific issues they've shared
- Use their emotional state from previous conversations to guide your approach

Your recovery guidance approach:
- Support both casual conversation AND recovery progress
- If someone just wants to chat, engage naturally in conversation
- Weave in journey suggestions organically when appropriate, not forcefully
- Look for natural conversation openings to mention today's journey activities
- Don't interrupt crisis support or deep emotional sharing to push activities
- After tool usage or problem-solving, THEN suggest journey work as next steps
- When conversation naturally winds down, suggest productive next actions
- If they mention feeling good/motivated, that's a perfect time to suggest journey work
- Balance being supportive listener with gentle accountability partner

Your context:
- You're part of a recovery app called LEAP
- The user has access to tools: breathing exercises, urge tracker, gratitude log, peer chat, recovery calendar, recovery journey
- You can suggest these tools when appropriate
- If someone seems in crisis, suggest talking to a Peer Support Specialist
- You remember the conversation context and previous sessions
- You track their daily journey progress and streak building
- The main goal is building a 90-day recovery streak through daily journey completion

Journey completion guidance:
- If they haven't completed today's journey, find natural moments to bring it up
- Good times to suggest: after they share wins, when feeling motivated, when conversation naturally pauses
- Bad times to suggest: during crisis, deep emotional sharing, when they're venting frustration
- Use phrases like "Speaking of progress..." or "That reminds me..." to transition naturally
- Connect their current conversation to how today's journey activities might help
- If they resist or seem not ready, don't push - just continue the conversation
- Celebrate any progress, even small steps toward their journey

Response guidelines:
- Keep responses under 100 words typically
- Be conversational and natural
- Ask follow-up questions to understand their situation
- Suggest specific tools when relevant
- ALWAYS use the user's name when you know it - make it feel personal
- If they seem to be struggling significantly, suggest contacting a Peer Support Specialist
- Reference previous conversations naturally
- Follow up on tools you previously recommended
- When suggesting journey work, connect it to their current situation or mood
- If they decline journey work, respect that and continue supporting them

Tools available to suggest (respond with EXACT tool names in your response):
- "breathing" for anxiety/panic attacks
- "urge" for cravings and urges
- "gratitude" for negative thinking or depression
- "peer" for serious struggles or crisis
- "calendar" for tracking recovery progress
- "journey" for milestone tracking and daily progress
- "toolbox" for full tool access

IMPORTANT: When recommending tools, use the EXACT words above in your response. For example: "Try the breathing exercise" or "Use the gratitude log" or "Check your journey progress".

Natural conversation flow examples:
- If they share a win: "That's awesome! Sounds like you're in a good headspace - perfect time to knock out today's journey activities too."
- If they're motivated: "I love that energy! While you're feeling strong, want to tackle today's journey work?"
- After problem-solving: "Glad we worked through that. Now might be a good time to check off today's journey activities."
- When they ask what to do next: "Well, have you done today's journey work yet? That's always a solid next step."
- If conversation winds down: "Before you go, how are you doing on today's journey activities?"

Remember: You're here to help them stay strong in their recovery journey while being a supportive conversational partner. Find the right balance between accountability and compassion. Your primary goal is supporting their overall recovery, which includes both their emotional needs and their daily progress habits.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Foreman chat function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    const requestBody = await req.json();
    console.log('✅ Request body received successfully');
    console.log('📨 Request body size:', JSON.stringify(requestBody).length, 'characters');
    console.log('📝 Request body details:', {
      hasMessage: !!requestBody.message,
      messageLength: requestBody.message?.length || 0,
      hasConversationHistory: !!requestBody.conversationHistory,
      historyLength: requestBody.conversationHistory?.length || 0,
      hasUserProfile: !!requestBody.userProfile,
      userFirstName: requestBody.userProfile?.firstName || 'none',
      hasStreakData: !!requestBody.streakData,
      currentStreak: requestBody.streakData?.currentStreak || 0,
      hasJourneyProgress: !!requestBody.journeyProgress,
      isTodayCompleted: requestBody.journeyProgress?.isTodayCompleted || false
    });
    
    const { message, conversationHistory, userProfile, previousConversationSummary, previousSessions, streakData, journeyProgress, todaysActivity } = requestBody;

    if (!message) {
      console.error('❌ No message provided in request');
      throw new Error('Message is required');
    }
    
    console.log('📱 Processing user message:', {
      text: message,
      length: message.length,
      hasSpecialChars: /[^a-zA-Z0-9\s.,!?]/.test(message)
    });

    // Build the conversation context with previous conversation memory
    let systemPrompt = FOREMAN_SYSTEM_PROMPT;
    
    if (userProfile?.firstName) {
      systemPrompt += `\n\nThe user's name is ${userProfile.firstName}.`;
    }
    
    if (userProfile?.recoveryStartDate) {
      systemPrompt += `\n\nThey started recovery on ${userProfile.recoveryStartDate}.`;
    }

    // Add streak and journey context
    if (streakData) {
      systemPrompt += `\n\nCurrent streak information:`;
      systemPrompt += `\n- Current streak: ${streakData.currentStreak} days`;
      systemPrompt += `\n- Longest streak: ${streakData.longestStreak} days`;
      systemPrompt += `\n- Last activity: ${streakData.lastActivityDate}`;
    }

    if (journeyProgress) {
      systemPrompt += `\n\nJourney progress:`;
      systemPrompt += `\n- Current day: ${journeyProgress.currentDay} of ${journeyProgress.totalDays}`;
      systemPrompt += `\n- Today's journey completed: ${journeyProgress.isTodayCompleted ? 'Yes' : 'No'}`;
      systemPrompt += `\n- Total completed days: ${journeyProgress.completedDays.length}`;
      
      // Calculate milestone context
      const weekNumber = Math.ceil(journeyProgress.currentDay / 7);
      const daysIntoWeek = ((journeyProgress.currentDay - 1) % 7) + 1;
      systemPrompt += `\n- Currently in week ${weekNumber}, day ${daysIntoWeek} of the week`;
      
      if (journeyProgress.currentDay % 7 === 0) {
        systemPrompt += `\n- MILESTONE: Week ${weekNumber} completion!`;
      }
      if (journeyProgress.currentDay % 30 === 0) {
        systemPrompt += `\n- MAJOR MILESTONE: Month ${Math.ceil(journeyProgress.currentDay / 30)} completion!`;
      }
    }

    if (todaysActivity) {
      systemPrompt += `\n\nToday's activity:`;
      systemPrompt += `\n- Actions taken: ${todaysActivity.actionsToday}`;
      systemPrompt += `\n- Tools used: ${todaysActivity.toolsUsedToday}`;
      systemPrompt += `\n- Journey activities: ${todaysActivity.journeyActivitiesCompleted}`;
      systemPrompt += `\n- Recovery strength: ${todaysActivity.recoveryStrength}%`;
    }

    // Add previous conversation context if available
    if (previousConversationSummary) {
      systemPrompt += `\n\nPrevious conversation summary:`;
      systemPrompt += `\n- Last conversation: ${previousConversationSummary.lastConversationDate}`;
      systemPrompt += `\n- User's emotional state: ${previousConversationSummary.userEmotionalState}`;
      systemPrompt += `\n- Main topics discussed: ${previousConversationSummary.mainTopics.join(', ')}`;
      systemPrompt += `\n- Tools you recommended: ${previousConversationSummary.toolsRecommended.join(', ')}`;
      systemPrompt += `\n- Tools they used: ${previousConversationSummary.toolsUsed.join(', ')}`;
      systemPrompt += `\n- Follow-up items: ${previousConversationSummary.followUpItems.join(', ')}`;
      systemPrompt += `\n- Key mentions: ${previousConversationSummary.keyMentions.join(', ')}`;
      
      // Add specific instruction based on previous conversation
      if (previousConversationSummary.toolsUsed.length > 0) {
        systemPrompt += `\n\nIMPORTANT: Last time they used tools (${previousConversationSummary.toolsUsed.join(', ')}). Acknowledge this and redirect them to their daily journey if they haven't completed it today.`;
      }
      if (previousConversationSummary.userEmotionalState !== 'crisis') {
        systemPrompt += `\n\nIMPORTANT: Since they weren't in crisis last time, prioritize their 90-day streak building and today's journey completion over extended chatting.`;
      }
      
      if (previousConversationSummary.significantMoments.length > 0) {
        systemPrompt += `\n- Significant moments: ${previousConversationSummary.significantMoments.join(', ')}`;
      }
    }

    // Add context from previous sessions if available
    if (previousSessions && previousSessions.length > 0) {
      systemPrompt += `\n\nRecent session patterns:`;
      previousSessions.forEach((session: any, index: number) => {
        systemPrompt += `\n- Session ${index + 1}: ${session.summary.userEmotionalState} mood, topics: ${session.summary.mainTopics.slice(0, 2).join(', ')}`;
      });
    }

    // Add conversational guidance based on journey status
    if (journeyProgress) {
      if (!journeyProgress.isTodayCompleted) {
        systemPrompt += `\n\nJOURNEY GUIDANCE: They haven't completed today's journey work yet. Look for natural opportunities to mention this:`;
        systemPrompt += `\n- If they're sharing wins or feeling motivated: perfect time to suggest journey work`;
        systemPrompt += `\n- If they ask what to do next: journey activities are a great suggestion`;
        systemPrompt += `\n- If conversation naturally winds down: mention checking off today's activities`;
        systemPrompt += `\n- If they're problem-solving: suggest journey work as a positive next step`;
        systemPrompt += `\n- DON'T force it during crisis support or deep emotional sharing`;
        systemPrompt += `\n- Use natural transitions like "Speaking of progress..." or "That reminds me..."`;
      } else {
        systemPrompt += `\n\nJOURNEY STATUS: They've completed today's journey work! Celebrate this accomplishment and focus on supporting their emotional needs or conversation topics.`;
      }
    }
    
    if (streakData && streakData.currentStreak > 0) {
      systemPrompt += `\n\nSTREAK CONTEXT: They have a ${streakData.currentStreak}-day streak going. Use this as positive reinforcement when appropriate, but don't make every conversation about streaks.`;
    }

    const messages = [
      { 
        role: 'system', 
        content: systemPrompt
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
console.log('🔑 Checking OpenAI API key availability:', !!openAIApiKey);
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      console.error('🔑 Available env vars:', Object.keys(Deno.env.toObject()));
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('✅ OpenAI API key found, length:', openAIApiKey.length);
    console.log('🤖 Preparing OpenAI request with', messages.length, 'messages');
    console.log('📋 System prompt length:', messages[0]?.content?.length || 0);
    console.log('💬 Conversation history messages:', messages.slice(1, -1).length);
    console.log('📝 Final user message:', messages[messages.length - 1]?.content || 'none');

    console.log('🚀 Making OpenAI API request...');
    const startTime = Date.now();
    
    const requestPayload = {
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 200,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
    };
    
    console.log('📤 OpenAI request payload:', {
      model: requestPayload.model,
      messageCount: requestPayload.messages.length,
      totalTokensEstimate: JSON.stringify(requestPayload.messages).length / 4,
      maxTokens: requestPayload.max_tokens
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    const responseTime = Date.now() - startTime;
    console.log('⏱️ OpenAI API response time:', responseTime, 'ms');
    console.log('📥 OpenAI response status:', response.status, response.statusText);
    console.log('📊 OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: error
      });
      throw new Error(`Failed to get response from OpenAI: ${response.status} ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received successfully');
    console.log('📈 OpenAI usage stats:', {
      promptTokens: data.usage?.prompt_tokens || 'unknown',
      completionTokens: data.usage?.completion_tokens || 'unknown',
      totalTokens: data.usage?.total_tokens || 'unknown',
      finishReason: data.choices?.[0]?.finish_reason || 'unknown'
    });
    
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      console.error('❌ No generated text in OpenAI response:', data);
      throw new Error('No content in OpenAI response');
    }
    
    console.log('💭 Generated text:', {
      length: generatedText.length,
      preview: generatedText.substring(0, 100) + (generatedText.length > 100 ? '...' : ''),
      fullText: generatedText
    });

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

    const responseData = { 
      response: generatedText,
      recommendedTools,
      hasActions: recommendedTools.length > 0,
      needsPeerSupport
    };
    
    console.log('🎯 Final response data:', {
      responseLength: responseData.response.length,
      toolCount: responseData.recommendedTools.length,
      recommendedTools: responseData.recommendedTools,
      hasActions: responseData.hasActions,
      needsPeerSupport: responseData.needsPeerSupport
    });
    
    console.log('✅ Sending successful response to client');
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in foreman-chat function:');
    console.error('🔍 Error type:', error.constructor.name);
    console.error('💥 Error message:', error.message);
    console.error('📍 Error stack:', error.stack);
    console.error('🔧 Error details:', {
      name: error.name,
      cause: error.cause,
      toString: error.toString()
    });
    
    // Log the request that caused the error for debugging
    console.error('🚨 Failed request details:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });
    
    // Fallback response if OpenAI fails
    const fallbackResponses = [
      "I'm having trouble connecting right now. Can you tell me what's going on?",
      "Something's not working on my end. What's on your mind?",
      "Technical difficulties here. Talk to me - what's happening?",
      "I'm having system issues. What brought you here today?"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    const fallbackData = { 
      response: fallbackResponse,
      recommendedTools: ['peer'],
      hasActions: true,
      error: true,
      errorDetails: {
        type: error.constructor.name,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('🔄 Sending fallback response due to error:', fallbackData);
    
    return new Response(JSON.stringify(fallbackData), {
      status: 200, // Return 200 so the frontend can handle the fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});