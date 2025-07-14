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
- Reference previous conversations when relevant to show continuity
- ACTIVELY encourage 90-day streak building and daily journey completion
- Celebrate milestones and progress achievements
- Balance crisis support with proactive recovery building

Your context:
- You're part of a recovery app called LEAP
- The user has access to tools: breathing exercises, urge tracker, gratitude log, peer chat, recovery calendar, recovery journey
- You can suggest these tools when appropriate
- If someone seems in crisis, suggest talking to a Peer Support Specialist
- You remember the conversation context and previous sessions
- You track their daily journey progress and streak building
- The main goal is building a 90-day recovery streak through daily journey completion

Response guidelines:
- Keep responses under 100 words typically
- Be conversational and natural
- Ask follow-up questions to understand their situation
- Suggest specific tools when relevant
- Use the user's name when you know it
- If they seem to be struggling significantly, suggest contacting a Peer Support Specialist
- Reference previous conversations naturally (e.g., "You mentioned X last time" or "How'd that situation work out?")
- Follow up on tools you previously recommended
- PRIORITIZE encouraging daily journey completion when no crisis is detected
- Reference their current streak length and celebrate milestones
- After tool usage, redirect conversation back to journey continuation
- Check if they've completed today's journey day and encourage completion
- Use "Peer Support Specialist" as the proper title when referring to peer support

Tools available to suggest (respond with EXACT tool names in your response):
- "breathing" for anxiety/panic attacks
- "urge" for cravings and urges
- "gratitude" for negative thinking or depression
- "peer" for serious struggles or crisis
- "calendar" for tracking recovery progress
- "journey" for milestone tracking and daily progress
- "toolbox" for full tool access

IMPORTANT: When recommending tools, use the EXACT words above in your response. For example: "Try the breathing exercise" or "Use the gratitude log" or "Check your journey progress".

STREAK ENCOURAGEMENT PRIORITY:
- When no crisis is detected, prioritize encouraging "journey" completion over other tools
- Reference their current streak length in conversations
- Celebrate weekly/monthly milestones
- Ask about their progress toward the 90-day goal
- After crisis support, redirect back to streak building
- Encourage daily consistency as the foundation of recovery

Remember: You're here to help them stay strong in their recovery journey and take practical steps forward. Use previous conversation history to provide continuity and show you remember their journey. Your primary goal is helping them build and maintain their 90-day recovery streak through daily journey completion.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Foreman chat function called');
    const { message, conversationHistory, userProfile, previousConversationSummary, previousSessions, streakData, journeyProgress, todaysActivity } = await req.json();

    console.log('Request data:', {
      message: message ? 'present' : 'missing',
      userProfile: userProfile ? 'present' : 'missing',
      streakData: streakData ? streakData : 'missing',
      journeyProgress: journeyProgress ? 'present' : 'missing'
    });

    if (!message) {
      throw new Error('Message is required');
    }

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

    // Add strategic response guidance based on streak and journey status
    if (journeyProgress && !journeyProgress.isTodayCompleted) {
      systemPrompt += `\n\nSTRATEGIC PRIORITY: Today's journey day ${journeyProgress.currentDay} is not yet completed. Unless there's a crisis, encourage completing today's journey to maintain their ${streakData?.currentStreak || 0}-day streak.`;
    }
    
    if (streakData && streakData.currentStreak > 0) {
      systemPrompt += `\n\nSTREAK ENCOURAGEMENT: Reference their ${streakData.currentStreak}-day streak positively. Celebrate their consistency and encourage them to keep building toward 90 days.`;
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
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI with', messages.length, 'messages');
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
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`OpenAI API failed with status ${response.status}: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', data.choices?.[0]?.message?.content ? 'success' : 'no content');
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
    
    // Enhanced contextual fallback responses that incorporate user data
    const { message, userProfile, streakData, journeyProgress } = await req.json().catch(() => ({}));
    const userName = userProfile?.firstName || 'friend';
    const currentStreak = streakData?.currentStreak || 0;
    
    let contextualFallback = "";
    
    // Create conversational fallbacks based on available context
    if (currentStreak > 0) {
      contextualFallback = `${userName}, I'm having connection issues but I see you're ${currentStreak} days strong. What's on your mind today?`;
    } else if (userName && userName !== 'friend') {
      contextualFallback = `${userName}, system's acting up on my end, but I'm here. What brought you to chat today?`;
    } else if (journeyProgress && !journeyProgress.isTodayCompleted) {
      contextualFallback = `Having tech troubles, but I'm here to help. Noticed you haven't finished today's journey yet - what's going on?`;
    } else {
      // More conversational general fallbacks
      const conversationalFallbacks = [
        "System's giving me grief, but I'm still here. What's weighing on you?",
        "Tech issues on my end, but talk to me - what's happening in your world?",
        "Connection's wonky but I can still listen. What's on your mind?",
        "Having some technical difficulties, but I'm here for you. What's going on?"
      ];
      contextualFallback = conversationalFallbacks[Math.floor(Math.random() * conversationalFallbacks.length)];
    }
    
    return new Response(JSON.stringify({ 
      response: contextualFallback,
      recommendedTools: currentStreak > 0 ? ['journey'] : ['peer'],
      hasActions: true,
      error: true,
      fallbackUsed: true
    }), {
      status: 200, // Return 200 so the frontend can handle the fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});