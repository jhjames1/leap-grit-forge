import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, interpolations?: Record<string, string | number>) => string;
  getArray: (key: string) => any[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize with a safe default to avoid null reference errors
  const [language, setLanguageState] = useState<Language>('en');

  // Initialize language from localStorage after component mounts
  useEffect(() => {
    try {
      const stored = localStorage.getItem('leap-language');
      if (stored && (stored === 'en' || stored === 'es')) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.warn('Failed to access localStorage, defaulting to English');
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('leap-language', newLanguage);
  };

  const t = (key: string, interpolations?: Record<string, string | number>): string => {
    return getTranslation(key, language, interpolations);
  };

  const getArray = (key: string): any[] => {
    return getArrayTranslation(key, language);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation function
const getTranslation = (key: string, language: Language, interpolations?: Record<string, string | number>): string => {
  const translations = language === 'es' ? spanishTranslations : englishTranslations;
  
  // Handle nested keys (e.g., 'home.welcome')
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // If key not found in Spanish, fall back to English
      if (language === 'es') {
        return getTranslation(key, 'en', interpolations);
      }
      return key; // Return the key itself if not found
    }
  }
  
  // Handle arrays (return random item for variety)
  if (Array.isArray(value)) {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    value = value[dayOfYear % value.length];
  }
  
  let result = typeof value === 'string' ? value : key;
  
  // Handle interpolations (e.g., {{day}}, {{count}})
  if (interpolations && typeof result === 'string') {
    Object.entries(interpolations).forEach(([placeholder, replacement]) => {
      const pattern = new RegExp(`{{${placeholder}}}`, 'g');
      result = result.replace(pattern, String(replacement));
    });
  }
  
  return result;
};

// Function to get array translations without processing
const getArrayTranslation = (key: string, language: Language): any[] => {
  const translations = language === 'es' ? spanishTranslations : englishTranslations;
  
  // Handle nested keys (e.g., 'home.motivation.headers')
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // If key not found in Spanish, fall back to English
      if (language === 'es') {
        return getArrayTranslation(key, 'en');
      }
      return []; // Return empty array if not found
    }
  }
  
  // Return the array as-is if it's an array, otherwise return empty array
  return Array.isArray(value) ? value : [];
};

// English translations
const englishTranslations = {
  // User Auth
  auth: {
    welcome: {
      title: 'Get Started',
      subtitle: 'Enter your first name to begin'
    },
    firstName: {
      label: 'First Name',
      placeholder: 'Enter your first name',
      required: 'Please enter your first name'
    },
    button: {
      enter: 'Enter App',
      processing: 'Processing...'
    },
    error: {
      general: 'An error occurred. Please try again.'
    }
  },

  // Onboarding
  onboarding: {
    step1: {
      title: 'What brings you to LEAP?',
      subtitle: 'Choose what you\'d like to build strength around.'
    },
    step2: {
      title: 'Where are you in your journey?',
      subtitle: 'We\'ll personalize things based on where you are.'
    },
    step3: {
      title: 'What helps you feel focused?',
      subtitle: 'We\'ll adjust your daily support to match your style.'
    },
    step4: {
      title: 'What\'s your first name?',
      subtitle: '(Optional, but helpful)',
      placeholder: 'Enter your first name'
    },
    button: {
      continue: 'Continue',
      letsLeap: 'Let\'s LEAP'
    },
    success: {
      title: 'Welcome to LEAP',
      subtitle: 'Let\'s take it one day at a time.'
    }
  },
  
  // Focus Areas
  focus: {
    toughMoments: 'Managing tough moments',
    connections: 'Building stronger connections',
    routines: 'Creating healthy routines',
    tools: 'Finding tools that work',
    stayingTrack: 'Staying on track'
  },
  
  // Journey Stages
  journeyStages: {
    starting: 'Just starting out',
    fewWeeks: 'A few weeks in',
    fewMonths: 'A few months strong',
    steady: 'Feeling steady, but staying sharp',
    startingAgain: 'Starting again after a pause'
  },
  
  // Support Styles
  support: {
    reflection: 'Quiet reflection & journaling',
    audio: 'Calming audio support',
    goals: 'Simple daily goals',
    progress: 'Seeing your progress',
    connection: 'Knowing someone\'s there'
  },

  // Personalized Greeting
  greeting: {
    good: 'Good',
    morning: 'morning',
    afternoon: 'afternoon',
    gladYoureHere: 'I\'m glad you\'re here.'
  },
  nav: {
    home: 'Home',
    journey: 'Journey',
    toolbox: 'Toolbox',
    chat: 'Chat',
    profile: 'Profile',
    calendar: 'Calendar',
    chatSupport: 'Chat Support',
    strengthMeter: 'Strength Meter'
  },
  
  // Home
  home: {
    welcome: 'Welcome',
    defaultWelcome: 'Welcome',
    journeyContinues: 'Your journey continues.',
    todaysMotivation: "Today's Motivation",
    currentDay: 'Day {{day}}: Building Daily Habits',
    motivation: {
      headers: [
        "Every day is a new opportunity to build the life you want.",
        "Strength doesn't come from what you can do. It comes from overcoming what you thought you couldn't.",
        "The only impossible journey is the one you never begin.",
        "Progress, not perfection, is the goal.",
        "You are stronger than your urges.",
        "One day at a time, one choice at a time.",
        "Your past doesn't define your future.",
        "Courage isn't the absence of fear, it's moving forward despite it.",
        "Every small step forward is a victory.",
        "Your path is a journey of self-discovery.",
        "You have the power to change your story.",
        "Healing happens one breath at a time.",
        "Your strength is greater than any challenge.",
        "Today is a new chance to choose growth."
      ]
    },
    streak: {
      title: 'Streak',
      days: 'days'
    },
    badges: {
      earned: 'Badges Earned',
      activities: 'Activities Completed'
    },
    startDay: 'Start Your Day',
    comingUp: 'Coming Up This Week',
    upcomingActivities: {
      weekend: 'Weekend Recovery Strategies',
      communication: 'Peer Communication',
      milestone: 'Month Milestone Review'
    },
    time: {
      tomorrow: 'Tomorrow',
      days: '{{count}} Days',
      week: '{{count}} Week'
    },
    completeCurrentDay: 'Complete your current day to see upcoming activities',
    activities: {
      'Understanding Your Triggers': 'Understanding Your Triggers',
      'The HALT Check': 'The HALT Check',
      'Creating Safe Spaces': 'Creating Safe Spaces',
      'The 5-Minute Rule': 'The 5-Minute Rule',
      'Body Scan Awareness': 'Body Scan Awareness',
      'Emergency Contact List': 'Emergency Contact List',
      'Week 1 Reflection': 'Week 1 Reflection',
      'Identify 3 personal triggers that lead to cravings': 'Identify 3 personal triggers that lead to cravings',
      'Practice the HALT technique: Hungry, Angry, Lonely, Tired': 'Practice the HALT technique: Hungry, Angry, Lonely, Tired',
      'Remove or modify 3 environmental triggers': 'Remove or modify 3 environmental triggers',
      'Wait 5 minutes before any urge-driven action': 'Wait 5 minutes before any urge-driven action',
      'Practice full body scan to identify early warning signs': 'Practice full body scan to identify early warning signs',
      'Create a list of 5 people to call during cravings': 'Create a list of 5 people to call during cravings',
      'Review your trigger patterns from this week': 'Review your trigger patterns from this week',
      'Urge Tracker': 'Urge Tracker',
      'Breathing Exercise': 'Breathing Exercise',
      'Gratitude Log': 'Gratitude Log',
      'Peer Support': 'Peer Support'
    },
    foreman: {
      title: 'The Foreman',
      subtitle: 'Your personal coach is here to help',
      button: 'Chat Now'
    },
    strengthLevel: 'Strength Level',
    leapProgress: 'Leap Progress',
    actionsToday: 'actions today',
    toolsUsed: 'tools used'
  },
  
  // Foreman Chat
    foreman: {
      title: 'The Foreman',
      subtitle: 'Your Recovery Mentor',
      greeting: {
        morning: 'You good, or are we faking it today?',
        afternoon: 'You clocking in or hiding out?',
        evening: 'What\'s pressing on you right now?'
      },
      initialPrompts: [
        'Alright {name}, what\'s the situation?',
        'Hey {name}, you good or are we faking it today?',
        '{name}, where\'s your head at right now?',
        'What\'s going on, {name}? Talk straight with me.',
        '{name}, you clocking in or hiding out?',
        'What\'s pressing on you, {name}?',
        'Alright {name}, let\'s get to work. What do you need?',
        '{name}, I can see you\'re here for a reason. What is it?'
      ],
      contextualGreetings: {
        returning: [
          'Hey {name}, last time we talked about {topic} - how\'s that been sitting with you?',
          '{name}, it\'s been {timeSince} since we talked. Still chewing on that {topic}?',
          'Back again, {name}. You mentioned {topic} before - any progress or still stuck?',
          '{name}, you seemed {mood} about {topic} last time. How\'s your head about it now?',
          'Good to see you again, {name}. Did you actually try that {tool} I mentioned?',
          '{name}, {timeSince} since our last chat. What\'s eating at you today?',
          'Alright {name}, last time was about {topic}. We moving forward or going in circles?',
          '{name}, been {timeSince}. That {topic} situation still got you wound up?'
        ],
        strugglingReturn: [
          '{name}, you were dealing with {topic} {timeSince}. How\'d that work out?',
          'Hey {name}, last time you seemed overwhelmed by {topic}. We making progress?',
          '{name}, you mentioned struggling with {topic} - still hitting you hard or you fighting back?',
          'Back for more, {name}. That {topic} situation still weighing heavy?',
          '{name}, {timeSince} since you were wrestling with {topic}. Win any rounds yet?',
          'Alright {name}, last time {topic} had you down. You getting back up or staying on the mat?'
        ],
        hopefulReturn: [
          '{name}, you sounded positive about {topic} last time. Still riding that wave?',
          'Hey {name}, you were making real progress with {topic}. How\'s momentum?',
          '{name}, you seemed stronger last time we talked. Still feeling that fire?',
          'Good to see you, {name}. You were working on {topic} - still building on it?',
          '{name}, last time you had some fight in you about {topic}. Still swinging?',
          'Alright {name}, {timeSince} since you sounded hopeful about {topic}. Reality matching the hope?'
        ],
        toolFollowUp: [
          '{name}, did you actually try that {tool} I suggested for {topic}?',
          'Hey {name}, you were going to work on {topic} with {tool}. You follow through or just talk?',
          '{name}, last time I mentioned {tool} for your {topic} situation. Did it make a difference or waste your time?',
          'Back again, {name}. Did that {tool} actually help with {topic} or should we try something else?',
          '{name}, {timeSince} since I suggested {tool} for {topic}. You use it or ignore it?',
          'Alright {name}, be straight with me - did you try {tool} for {topic} or are we still talking instead of doing?'
        ],
        longGap: [
          '{name}, it\'s been {timeSince} since we talked. That\'s a long stretch. What\'s happening in your world?',
          'Hey {name}, {timeSince} since our last conversation. A lot changes in that time. Where are you at?',
          '{name}, been a while. {timeSince} to be exact. What brought you back to the table?',
          'Long time, {name}. {timeSince} since we last talked. You been handling things or avoiding them?',
          '{name}, {timeSince} gap there. That\'s either really good or really concerning. Which is it?',
          'Alright {name}, {timeSince} since we talked. You been building or just surviving?'
        ],
        crisisReturn: [
          '{name}, you were in a real tough spot {timeSince}. How you holding up now?',
          'Hey {name}, last time was heavy stuff. {timeSince} later, you still standing?',
          '{name}, you were struggling hard {timeSince}. Made it through - that\'s something. How\'s today?',
          'Good to see you back, {name}. {timeSince} since that rough conversation. You in a better place?',
          '{name}, {timeSince} since things were really dark. You fought through it. What\'s your status now?',
          'Alright {name}, last time you were hurting bad. {timeSince} later and you\'re here. That takes guts. How are you really doing?'
        ]
      },
      streakFocus: [
        'Tools are good, {name}, but your streak is what matters. Have you done today\'s journey?',
        'Alright {name}, you\'ve used the tool - now get back to building that streak. Today\'s journey done?',
        '{name}, we can talk all day, but have you completed day {currentDay} of your journey?',
        'Tools help, {name}, but they\'re not the main event. Your 90-day streak is. Today\'s work done?',
        '{name}, you\'re at day {currentDay} of 90. Don\'t let talking replace doing. Journey completed today?',
        'Good on using tools, {name}, but your streak doesn\'t build itself. What about today\'s journey?',
        '{name}, {currentStreak} days strong. Keep that momentum - have you done today\'s journey work?'
      ],
      avoidanceCheck: [
        '{name}, are we talking because you\'re avoiding today\'s journey work?',
        'Hold up, {name}. You here to chat or to build your streak? Today\'s journey done?',
        '{name}, talking\'s fine, but not if you\'re dodging day {currentDay} of your journey.',
        'Real talk, {name} - are you using this chat to avoid doing the actual work?',
        '{name}, I see you here chatting. Your streak sees you too. Today\'s journey completed?'
      ],
      followUp1: [
        'That been building for a while or just hit today?',
        'What\'s been stopping you from dealing with it?',
        'Who else knows what you\'re carrying?',
        'How long you been sitting on that?',
        'What\'s really eating at you?'
      ],
      followUp2: [
        'That sounds like burnout, not failure. Big difference.',
        'So you\'ve been pushing through alone. That ends today.',
        'You\'re showing up, even tired. That\'s not nothing.',
        'I hear that. But feeling like you don\'t matter and actually not mattering are two different things.',
        'You\'re still standing. That counts for something.'
      ],
      toolSuggestions: {
        breathingRoom: 'Here\'s what I\'m thinking - you need breathing room. Hit the breathing tool. Ten minutes. That\'s the ask.',
        urgeTracker: 'Listen, sounds like your brain\'s racing. Try the urge tracker. Catch the spiral early.',
        peerChat: 'You\'re not alone, even if it feels like it. Here\'s a thought - talking to a Peer Support Specialist is how we start proving that.',
        gratitude: 'Your mind\'s stuck in the negative loop. Would you try the gratitude tool? Find three things. Real ones.',
        strengthMeter: 'Here\'s an idea - check your recovery strength. See where you really stand right now.'
      },
      responses: {
        struggling: [
          'Been there. What\'s the heaviest thing you\'re carrying right now?',
          'Rough day or rough stretch?',
          'Talk to me straight. What\'s breaking down?'
        ],
        hopeful: [
          'I hear that energy. What\'s working for you?',
          'Good. What\'s different about today?',
          'That\'s real progress. What changed?'
        ],
        frustrated: [
          'Yeah, I can hear that. What\'s got you wound up?',
          'Frustration\'s energy. What are you gonna do with it?',
          'What\'s pissing you off? Be honest.'
        ],
        neutral: [
          'Okay. Where do we start today?',
          'I\'m listening. What\'s on your mind?',
          'What do you need to get off your chest?'
        ]
      },
      actions: {
        saveWisdom: 'Save This',
        fieldStory: 'Field Story',
        talkToPeer: 'Talk to Peer Support Specialist'
      },
      fieldStories: [
        'Met someone at a meeting who couldn\'t sleep for weeks after getting clean. She was exhausted, angry, and ready to give up. Her sponsor told her to write down three things she was grateful for every single day, even when she hated it. She said those gratitude lists saved her life because they forced her to find light when everything felt dark.',
        'Knew this guy who relapsed after two years sober. He was ashamed, thought he\'d lost everything and had to start over. His sponsor reminded him that those two years weren\'t erased - they were proof he could do it. He got back up, used what he learned, and now has five years clean.',
        'Worked with someone whose family wouldn\'t talk to him for the first year of recovery. He was hurt and wanted to isolate, but he kept showing up to meetings anyway. Slowly, consistently, he proved through his actions that he was changing. Now his kids call him again, and he says patience was the hardest lesson he ever learned.',
        'Had a friend who got triggered every time he passed his old dealer\'s corner. Instead of changing his whole route, he started bringing his sponsor\'s number up on his phone before he got there. He\'d call the second he felt the urge, talk it through, and keep walking. Now he barely notices that corner anymore.',
        'Met this woman who said her biggest breakthrough came when she stopped trying to be perfect. She\'d been beating herself up for every small mistake, thinking she was weak. Her therapist asked her if she\'d talk to a friend the way she talked to herself. She realized self-compassion wasn\'t giving up - it was giving herself the strength to keep going.',
        'Knew someone who white-knuckled it for months, refusing help and trying to do recovery alone. He was miserable, angry, and barely holding on. Finally broke down and asked for help at a meeting. He said learning to accept support was harder than getting clean, but it made all the difference in actually staying clean.',
        'Worked with a guy who lost his job in early recovery and felt like the universe was against him. He was bitter, scared, and ready to throw in the towel. His sponsor helped him see it as a chance to build something better. He went back to school, got certified, and now he helps other people in recovery find work.',
        'Had a friend who couldn\'t handle being around drinking at family events. She felt guilty and broken, like she was letting everyone down. Her sponsor told her that protecting her sobriety wasn\'t selfish - it was necessary. She started hosting her own sober gatherings, and now half her family joins her because they prefer it.',
        'Met someone who said his worst day sober was still better than his best day using. He was having a panic attack at work, feeling like he couldn\'t cope without substances. He called his sponsor, did breathing exercises, and pushed through. Later he realized that facing his feelings head-on, even when it hurt, was what real strength looked like.',
        'Knew this person who struggled with shame for years, convinced they were a bad person who didn\'t deserve recovery. They started volunteering at a recovery center, helping newcomers get through their first days. Seeing their story help others heal made them realize they weren\'t broken - they were wounded, and wounded people can help other wounded people heal.',
        'Worked with someone who kept trying to rush their recovery, wanting to feel better immediately. They were impatient, frustrated, and kept comparing themselves to others. Their sponsor reminded them that recovery is like building a house - you can\'t skip the foundation. They learned to celebrate small wins and trust the process.',
        'Had a friend who thought recovery meant being happy all the time. When they felt sad or angry, they panicked and thought they were failing. Their therapist taught them that sobriety wasn\'t about eliminating emotions - it was about feeling them without using. Learning to sit with discomfort without running became their superpower.'
      ],
      placeholder: 'Type your message...',
      send: 'Send',
      listening: 'Listening...',
      stopListening: 'Stop',
      wisdomSaved: 'Saved to your wisdom collection',
      wisdomSaveError: 'Could not save this wisdom'
    },
  
  // Journey
  journey: {
    title: 'Your Journey',
    subtitle: '90-day guided track',
    day: 'Day',
    complete: 'Complete',
    locked: 'Locked',
    completed: 'Completed',
    review: 'Review',
    start: 'Start',
    overallProgress: 'Overall Progress',
    journeyProgress: 'Journey Progress',
    weekFoundation: 'Week 1: Foundation',
    upcomingDays: 'Next 3 Days',
    dayModules: {
      day1: {
        title: 'Starting Your Journey',
        theme: 'Foundation',
        welcomeMessage: 'Welcome to LEAP - Your journey starts here',
        activities: {
          welcomeAudio: 'Welcome Message (2 min.)',
          howRecoveryWorks: 'How Recovery Works',
          yourWhy: 'Your Why'
        }
      },
      day2: {
        title: 'Understanding Triggers',
        theme: 'Awareness'
      },
      day3: {
        title: 'Building Your Support Network',
        theme: 'Connection'
      },
      day4: {
        title: 'Why You Want to Recover',
        theme: 'Motivation'
      },
      day5: {
        title: 'Naming the Real Enemy',
        theme: 'Identity'
      },
      day6: {
        title: 'Creating Your Safe Space',
        theme: 'Environment'
      },
      day7: {
        title: 'One Week Strong – Quick Reflection',
        theme: 'Reflection'
      }
    },
    notifications: {
      dayLocked: 'Day Locked',
      unlock1201: 'Days unlock at 12:01 AM each day',
      completeFirst: 'Complete Day {{day}} first to unlock this day',
      reminderTitle: 'LEAP Reminder',
      reminder12h: "You've got 12 hours left to complete today's LEAP. Keep going—you're doing great.",
      almostThere: 'Almost There',
      almostThereMsg: "Almost there. Let's finish strong.",
      finalHour: 'Final Hour',
      finalHourMsg: "One hour left today. Let's LEAP!",
      week1Complete: 'Week 1 Complete! 🏆',
      week1CompleteMsg: "You've unlocked your Week 1 Badge. Amazing progress!",
      dayComplete: 'Day {{day}} Complete! ✅',
      dayCompleteMsg: "Great work! You're building strong recovery foundations."
    }
  },
  
  // Toolbox
  toolbox: {
    title: 'Your Toolbox',
    titleParts: ['YOUR', 'TOOLBOX'],
    subtitle: 'Your support tools, always ready',
    stats: {
      todayTools: 'Tools Used Today',
      dayStreak: 'Day Streak', 
      totalSessions: 'Total Sessions'
    },
    emergency: {
      title: 'Emergency Help',
      description: 'Get immediate support',
      button: 'I Need Help Now',
      badge: 'Emergency'
    },
    tools: {
      foreman: {
        title: 'The Foreman',
        description: 'Mentor and Affirmations',
        badge: 'AI Chat'
      },
      urgeTracker: {
        title: 'Redline Recovery',
        description: 'Track urges & get redirected',
        badge: 'Track'
      },
      breathingExercise: {
        title: 'SteadySteel',
        description: 'Interactive breathing exercise',
        badge: 'Calm'
      },
      gratitudeLog: {
        title: 'Gratitude Log',
        description: 'Focus on the positive',
        badge: 'Mindset'
      }
    },
    recentActivity: 'Recent Activity',
    recentActivityEmpty: 'Your completed activities will appear here as you use the tools.',
    peerSupport: {
      title: 'PEER SUPPORT',
      subtitle: 'Choose someone to talk with',
      yearsInRecovery: 'Years in Recovery:',
      status: {
        online: 'Online',
        away: 'Away',
        offline: 'Offline'
      },
      availability: {
        availableNow: 'Available now',
        backIn15: 'Back in 15 mins',
        availableAt: 'Available at'
      },
      actions: {
        startChat: 'Start Chat',
        leaveMessage: 'Leave Message'
      },
      emergencySupport: {
        title: 'Need Immediate Support?',
        description: 'If you\'re in crisis, call the National Suicide Prevention Lifeline',
        callButton: 'Call 988'
      },
      offlineConfirm: 'is currently offline. Would you like to leave a message?'
    },
    toolTitles: {
      emergencyHelp: 'Emergency Help',
      emergencyDesc: 'Get immediate support',
      foremanTitle: 'The Foreman',
      foremanDesc: 'Mentor and Affirmations',
      redlineTitle: 'Redline Recovery',
      redlineDesc: 'Track urges & get redirected',
      steadySteelTitle: 'SteadySteel',
      steadySteelDesc: 'Interactive breathing exercise',
      gratitudeTitle: 'Gratitude Log',
      gratitudeDesc: 'Focus on the positive'
    },
    badges: {
      emergency: 'Emergency',
      aiChat: 'AI Chat',
      track: 'Track',
      calm: 'Calm',
      mindset: 'Mindset'
    },
    savedWisdom: {
      title: 'Saved Wisdom',
      subtitle: 'Your collected insights from The Foreman',
      empty: 'No saved wisdom yet. Chat with The Foreman and save meaningful messages.',
      recentTitle: 'Recently Saved',
      categories: {
        all: 'All',
        affirmation: 'Affirmations',
        guidance: 'Guidance', 
        story: 'Stories',
        'tool-suggestion': 'Tool Tips'
      },
      remove: 'Remove',
      confirmRemove: 'Remove this saved wisdom?'
    }
  },
  
  // Calendar
  calendar: {
    subtitle: "Track your daily progress",
    completedDays: "Completed Days",
    completionRate: "Success Rate",
    legend: "Legend",
    completedDay: "Completed day",
    missedDay: "Missed day",
    today: "Today",
    futureDay: "Future day",
    cta: "Take the next LEAP today",
    ctaSubtitle: "Continue your recovery journey"
  },

  // Profile
  profile: {
    title: "YOUR PROFILE",
    subtitle: "Track your progress and achievements",
    memberSince: "Member since {{date}}",
    lastLogin: "Last login: {{date}}",
    recoveryStreak: "Recovery Streak",
    totalToolsUsed: "Total Tools Used",
    urgesTracked: "Urges Tracked",
    thisWeek: "this week",
    days: "days",
    times: "times",
    mostUsedTool: "Most Used Tool:",
    weeklyProgress: "Weekly Progress:",
    tracked: "% tracked",
    favorites: "Favorite Tools",
    achievements: "Achievements",
    earned: "Earned {{time}}",
    badges: {
      weekWarrior: "Week Warrior",
      steadyBreather: "Steady Breather", 
      toolMaster: "Tool Master"
    },
    months: {
      january: "January",
      february: "February", 
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    },
    tools: {
      steadySteel: "SteadySteel",
      peerChat: "Peer Chat",
      foremanChat: "The Foreman",
      urgeTracker: "Redline Recovery",
      gratitudeLog: "Gratitude Log",
      breathingExercise: "SteadySteel",
      noneYet: "None yet"
    },
    settings: "Settings",
    editProfile: "Edit Profile",
    notificationSettings: "Notification Settings",
    weeklyCheckIn: "Weekly Check-In Schedule"
  },

  // Peer Chat
  peerChat: {
    secureChat: 'Secure & Confidential Chat',
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
    typing: '{{name}} is typing...',
    typingPlaceholder: 'Type your message...',
    quickActions: {
      needSupport: 'Need Support',
      feelingTriggered: 'Feeling Triggered',
      goodDay: 'Good Day Today',
      question: 'Question'
    },
    checkIn: {
      title: 'Weekly Check-in Available',
      subtitle: 'Schedule with {{name}}',
      button: 'Schedule'
    },
    unavailable: {
      calls: 'This specialist is not available for calls right now.',
      video: 'This specialist is not available for video calls right now.'
    }
  },


  // Edit Profile
  editProfile: {
    title: "EDIT PROFILE",
    firstName: "First Name",
    phoneNumber: "Phone Number",
    firstNamePlaceholder: "Enter your first name",
    phoneNumberPlaceholder: "(555) 123-4567",
    firstNameRequired: "First name is required",
    phoneNumberInvalid: "Phone number must be 10 digits",
    updating: "Updating...",
    updateProfile: "Update Profile",
    updateSuccess: "Profile updated successfully!",
    updateError: "Failed to update profile. Please try again."
  },

  // Notifications
  notifications: {
    title: "NOTIFICATION SETTINGS",
    dailyCheckIns: "Daily Check-ins",
    morningCheckIn: "Morning Check-in",
    morningCheckInDesc: "Get reminded to start your day right",
    reminderTime: "Reminder Time",
    recoverySupport: "Recovery Support",
    peerMessages: "Peer Messages",
    peerMessagesDesc: "Notifications from peer specialists",
    weeklyProgress: "Weekly Progress",
    weeklyCheckIn: "Weekly Check-in",
    weeklyCheckInDesc: "Review your progress and set goals",
    notificationMethod: "Notification Method",
    pushNotifications: "Push Notifications",
    pushNotificationsDesc: "Receive notifications on this device",
    smsNotifications: "SMS Notifications",
    smsNotificationsDesc: "Text message alerts and reminders",
    saveSettings: "Save Settings"
  },

  // Breathing Exercise
  breathing: {
    title: "SteadySteel",
    subtitle: "Feel that pressure in your chest? Let's ease it out.",
    sessionLength: "Session Length:",
    backgroundSound: "Background Sound",
    voiceGuide: "Voice Guide (British Female)",
    startSession: "Start Session",
    close: "Close",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    rest: "Rest",
    breathCycle: "Breath Cycle:",
    voicePrompts: {
      inhale: "Inhale slow and steady",
      hold: "Hold it, stay with me",
      exhale: "Now exhale, let that tension drain",
      rest: "You're steady, you're solid"
    },
    completionMessages: [
      "That's what slowing down feels like. Solid work.",
      "Good move. You just reset your system.",
      "Steady breathing, steady mind. Well done."
    ],
    backgroundSounds: [
      "Workshop Hum",
      "West Texas Wind",
      "Campfire Crackle",
      "Silent Mode"
    ]
  },

  // Urge Tracker
  urgeTracker: {
    title: "Redline Recovery",
    subtitle: "Let's track what you're feeling and find the right support.",
    whatUrge: "What are you feeling an urge to do?",
    howStrong: "How strong is it right now?",
    whatsBehind: "What's behind it?",
    redirect: "Let's redirect this energy.",
    closeForNow: "Close for Now",
    continue: "Continue",
    useBreathing: "Use the Breathing Tool now",
    hearForeman: "Hear from The Foreman",
    checkPeer: "Check in with your Peer",
    readAffirmation: "Read a saved affirmation",
    checkInTime: "Check-In Time",
    checkInSubtitle: "Still riding that wave? Let's check in.",
    actedOnUrge: "Did you act on the urge?",
    no: "No",
    slippedStopped: "Slipped but Stopped",
    yes: "Yes",
    whatHelped: "What helped—or didn't?",
    whatHelpedPlaceholder: "Quick thoughts on what worked or what made it harder...",
    optionalReflection: "Optional reflection",
    reflectionPlaceholder: "Anything else on your mind?",
    saveReflection: "Save Reflection",
    skipForNow: "Skip for Now",
    urgeTypes: {
      drink: "Drink",
      use: "Use",
      rage: "Rage",
      isolate: "Isolate",
      porn: "View Porn",
      overeat: "Overeat",
      other: "Other"
    },
    triggers: {
      stress: "Stress",
      shame: "Shame",
      loneliness: "Loneliness",
      anger: "Anger",
      exhaustion: "Exhaustion",
      boredom: "Boredom",
      unknown: "Unknown"
    },
    intensityLabels: {
      mild: "Mild",
      moderate: "Moderate",
      strong: "Strong",
      redZone: "Red Zone"
    }
  },

  // About page
  about: {
    title: 'ABOUT',
    subtitle: 'Your recovery companion',
    mission: {
      title: 'Our Mission',
      description: 'LEAP is designed specifically for men in labor-intensive fields who are navigating their journey. We understand the unique challenges you face and provide practical, no-nonsense tools to support your progress.'
    },
    privacy: {
      title: 'Your Privacy Matters',
      anonymity: 'Complete Anonymity:',
      anonymityDesc: 'Your identity is protected. You can use the app without revealing personal information.',
      communication: 'Secure Communication:',
      communicationDesc: 'All peer chats and check-ins are encrypted and confidential.',
      judgment: 'No Judgment Zone:',
      judgmentDesc: 'This is your safe space to be honest about your struggles and victories.'
    },
    community: {
      title: 'Peer Support',
      description: 'Connect with certified peer specialists who understand your industry and challenges. They\'ve walked this path and are here to support you without judgment.'
    },
    values: {
      title: 'Our Values',
      respect: 'Respect:',
      respectDesc: 'Your journey, your pace, your choices',
      strength: 'Strength:',
      strengthDesc: 'Building on the resilience you already have',
      connection: 'Connection:',
      connectionDesc: 'You don\'t have to do this alone',
      progress: 'Progress:',
      progressDesc: 'Every step forward counts'
    },
    terms: {
      title: 'Terms & Conditions',
      usage: 'By using LEAP, you agree to use the app responsibly and respect the privacy of other users.',
      medical: 'This app is a support tool and does not replace professional medical advice or treatment.',
      emergency: 'In case of emergency or immediate danger, please contact 911 or your local emergency services.',
      crisis: 'For crisis support, contact the National Suicide Prevention Lifeline at 988.'
    },
    footer: 'LEAP is proudly developed by Thriving United, dedicated to supporting recovery in working communities.'
  },

  // Admin Dashboard
  admin: {
    title: 'ADMIN',
    dashboardTitle: 'DASHBOARD',
    subtitle: 'Recovery engagement analytics',
    back: 'Back',
    tabs: {
      overview: 'Overview',
      security: 'Security'
    },
    timeframes: {
      week: 'Week',
      month: 'Month',
      quarter: 'Quarter'
    },
    metrics: {
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      avgStrength: 'Avg Strength',
      atRisk: 'At Risk'
    },
    sections: {
      domainEngagement: 'Domain Engagement',
      userRiskAssessment: 'User Risk Assessment',
      strength: 'Strength'
    },
    domains: {
      peerSupport: 'Peer Support',
      selfCare: 'Self-Care',
      structure: 'Structure',
      mood: 'Mood',
      cravingControl: 'Craving Control'
    },
    riskLevels: {
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW'
    }
  },

  // Common
  common: {
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    done: 'Done',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    play: 'Play',
    pause: 'Pause',
    progress: 'Progress',
    markComplete: 'Mark Complete',
    complete: 'Complete',
    completed: 'Completed',
    continue: 'Continue',
    of: 'of',
    min: 'min',
    day: 'Day',
    unlock: 'Complete previous activity to unlock',
    completeDay: 'Complete Day',
    completeMore: 'Complete {{count}} more'
  }
};

// Spanish translations
const spanishTranslations = {
  // User Auth
  auth: {
    welcome: {
      title: 'Comenzar',
      subtitle: 'Ingresa tu nombre para empezar'
    },
    firstName: {
      label: 'Nombre',
      placeholder: 'Ingresa tu nombre',
      required: 'Por favor ingresa tu nombre'
    },
    button: {
      enter: 'Entrar a la App',
      processing: 'Procesando...'
    },
    error: {
      general: 'Ocurrió un error. Por favor intenta de nuevo.'
    }
  },

  // Onboarding
  onboarding: {
    step1: {
      title: '¿Qué te trae a LEAP hoy?',
      subtitle: 'Elige en qué te gustaría fortalecer.'
    },
    step2: {
      title: '¿Dónde estás en tu camino?',
      subtitle: 'Personalizaremos según donde te encuentres.'
    },
    step3: {
      title: '¿Qué te ayuda a sentirte enfocado?',
      subtitle: 'Ajustaremos tu apoyo diario según tu estilo.'
    },
    step4: {
      title: '¿Cuál es tu nombre?',
      subtitle: '(Opcional, pero útil)',
      placeholder: 'Ingresa tu nombre'
    },
    button: {
      continue: 'Continuar',
      letsLeap: 'Vamos a DAR EL SALTO'
    },
    success: {
      title: 'Bienvenido a LEAP',
      subtitle: 'Vamos día a día.'
    }
  },
  
  // Focus Areas
  focus: {
    toughMoments: 'Manejar momentos difíciles',
    connections: 'Construir conexiones más fuertes',
    routines: 'Crear rutinas saludables',
    tools: 'Encontrar herramientas que funcionen',
    stayingTrack: 'Mantenerme en el camino'
  },
  
  // Journey Stages
  journeyStages: {
    starting: 'Apenas comenzando',
    fewWeeks: 'Unas semanas en el camino',
    fewMonths: 'Unos meses fuerte',
    steady: 'Sintiéndome estable, pero manteniéndome alerta',
    startingAgain: 'Comenzando de nuevo después de una pausa'
  },
  
  // Support Styles
  support: {
    reflection: 'Reflexión tranquila y escritura',
    audio: 'Apoyo de audio calmante',
    goals: 'Metas diarias simples',
    progress: 'Ver tu progreso',
    connection: 'Saber que alguien está ahí'
  },

  // Personalized Greeting
  greeting: {
    good: 'Buenos',
    morning: 'días',
    afternoon: 'tardes',
    evening: 'noches',
    gladYoureHere: 'Me alegra que estés aquí.',
    button: {
      continue: 'Continuar',
      letsLeap: 'Vamos a DAR EL SALTO'
    }
  },

  // Navigation
  nav: {
    home: 'Inicio',
    journey: 'Viaje',
    toolbox: 'Herramientas',
    chat: 'Chat',
    profile: 'Perfil',
    calendar: 'Calendario',
    chatSupport: 'Soporte de Chat',
    strengthMeter: 'Medidor de Fuerza'
  },
  
  // Home
  home: {
    welcome: 'Bienvenido',
    defaultWelcome: 'Bienvenido',
    journeyContinues: 'Tu viaje continúa.',
    todaysMotivation: 'Motivación de Hoy',
    currentDay: 'Día {{day}}: Construyendo Hábitos Diarios',
    motivation: {
      headers: [
        "Cada día es una nueva oportunidad para construir la vida que quieres.",
        "La fuerza no viene de lo que puedes hacer. Viene de superar lo que pensaste que no podías.",
        "El único viaje imposible es el que nunca comienzas.",
        "El progreso, no la perfección, es la meta.",
        "Eres más fuerte que tus impulsos.",
        "Un día a la vez, una decisión a la vez.",
        "Tu pasado no define tu futuro.",
        "El coraje no es la ausencia del miedo, es seguir adelante a pesar de él.",
        "Cada pequeño paso adelante es una victoria.",
        "Tu camino es un viaje de autodescubrimiento.",
        "Tienes el poder de cambiar tu historia.",
        "La sanación ocurre una respiración a la vez.",
        "Tu fuerza es mayor que cualquier desafío.",
        "Hoy es una nueva oportunidad para elegir el crecimiento."
      ]
    },
    streak: {
      title: 'Racha',
      days: 'días'
    },
    badges: {
      earned: 'Insignias Ganadas',
      activities: 'Actividades Completadas'
    },
    startDay: 'Comienza tu Día',
    comingUp: 'Próximamente Esta Semana',
    upcomingActivities: {
      weekend: 'Estrategias de Recuperación de Fin de Semana',
      communication: 'Comunicación con Compañeros',
      milestone: 'Revisión del Hito del Mes'
    },
    time: {
      tomorrow: 'Mañana',
      days: '{{count}} Días',
      week: '{{count}} Semana'
    },
    completeCurrentDay: 'Completa tu día actual para ver las próximas actividades',
    activities: {
      'Understanding Your Triggers': 'Entendiendo Tus Factores Desencadenantes',
      'The HALT Check': 'La Verificación HALT',
      'Creating Safe Spaces': 'Creando Espacios Seguros',
      'The 5-Minute Rule': 'La Regla de los 5 Minutos',
      'Body Scan Awareness': 'Conciencia del Escaneo Corporal',
      'Emergency Contact List': 'Lista de Contactos de Emergencia',
      'Week 1 Reflection': 'Reflexión de la Semana 1',
      'Identify 3 personal triggers that lead to cravings': 'Identifica 3 factores desencadenantes personales que llevan a los antojos',
      'Practice the HALT technique: Hungry, Angry, Lonely, Tired': 'Practica la técnica HALT: Hambriento, Enojado, Solo, Cansado',
      'Remove or modify 3 environmental triggers': 'Elimina o modifica 3 factores desencadenantes ambientales',
      'Wait 5 minutes before any urge-driven action': 'Espera 5 minutos antes de cualquier acción impulsiva',
      'Practice full body scan to identify early warning signs': 'Practica el escaneo completo del cuerpo para identificar señales de advertencia temprana',
      'Create a list of 5 people to call during cravings': 'Crea una lista de 5 personas a las que llamar durante los antojos',
      'Review your trigger patterns from this week': 'Revisa tus patrones de factores desencadenantes de esta semana',
      'Urge Tracker': 'Rastreador de Impulsos',
      'Breathing Exercise': 'Ejercicio de Respiración',
      'Gratitude Log': 'Registro de Gratitud',
      'Peer Support': 'Apoyo de Compañeros'
    },
    foreman: {
      title: 'El Capataz',
      subtitle: 'Tu entrenador personal está aquí para ayudar',
      button: 'Chatear Ahora'
    },
    strengthLevel: 'Nivel de Fuerza',
    leapProgress: 'Progreso de Salto',
    actionsToday: 'acciones hoy',
    toolsUsed: 'herramientas usadas'
  },
  
  // Foreman Chat
  foreman: {
    title: 'El Capataz',
    subtitle: 'Tu Mentor de Recuperación',
    greeting: {
      morning: '¿Estás bien, o estamos fingiendo hoy?',
      afternoon: '¿Estás trabajando o escondiéndote?',
      evening: '¿Qué te está presionando ahora mismo?'
    },
    initialPrompts: [
      '¿Estás bien, o estamos fingiendo hoy?',
      '¿Estás trabajando o escondiéndote?',
      '¿Qué te está presionando ahora mismo?',
      '¿Dónde tienes la cabeza?'
    ],
    followUp1: [
      '¿Eso ha estado creciendo por un tiempo o te pegó hoy?',
      '¿Qué te ha estado impidiendo lidiar con eso?',
      '¿Quién más sabe lo que estás cargando?',
      '¿Cuánto tiempo has estado sentado sobre eso?',
      '¿Qué te está carcomiendo realmente?'
    ],
    followUp2: [
      'Eso suena como agotamiento, no fracaso. Gran diferencia.',
      'Así que has estado empujando solo. Eso termina hoy.',
      'Te estás presentando, aunque cansado. Eso no es nada.',
      'Te escucho. Pero sentir que no importas y realmente no importar son dos cosas diferentes.',
      'Sigues de pie. Eso cuenta para algo.'
    ],
    toolSuggestions: {
      breathingRoom: 'Necesitas espacio para respirar. Usa la herramienta de respiración. Diez minutos. Eso es lo que pido.',
      urgeTracker: 'Parece que tu cerebro está acelerado. Prueba el rastreador de impulsos. Atrapa la espiral temprano.',
      peerChat: 'No estás solo, aunque se sienta así. Hablar con un Especialista de Apoyo Entre Pares es como empezamos a probarlo.',
      gratitude: 'Tu mente está atascada en el bucle negativo. Herramienta de gratitud - encuentra tres cosas. Reales.',
      strengthMeter: 'Revisa tu fuerza de recuperación. Ve dónde realmente estás parado ahora.'
    },
    responses: {
      struggling: [
        'He estado ahí. ¿Qué es lo más pesado que estás cargando ahora?',
        '¿Día difícil o racha difícil?',
        'Háblame directo. ¿Qué se está rompiendo?'
      ],
      hopeful: [
        'Escucho esa energía. ¿Qué te está funcionando?',
        'Bien. ¿Qué es diferente sobre hoy?',
        'Eso es progreso real. ¿Qué cambió?'
      ],
      frustrated: [
        'Sí, puedo escuchar eso. ¿Qué te tiene tenso?',
        'La frustración es energía. ¿Qué vas a hacer con ella?',
        '¿Qué te está molestando? Sé honesto.'
      ],
      neutral: [
        'Okay. ¿Por dónde empezamos hoy?',
        'Estoy escuchando. ¿Qué tienes en mente?',
        '¿Qué necesitas sacar de tu pecho?'
      ]
    },
    actions: {
      toolBelt: 'Agregar al Cinturón',
      fieldStory: 'Historia del Campo',
      talkToPeer: 'Hablar con Especialista de Apoyo Entre Pares'
    },
    fieldStories: [
      'Conocí a alguien en una reunión que no podía dormir durante semanas después de limpiarse. Estaba agotada, enojada y lista para rendirse. Su padrino le dijo que escribiera tres cosas por las que estaba agradecida todos los días, incluso cuando lo odiaba. Dijo que esas listas de gratitud le salvaron la vida porque la obligaron a encontrar luz cuando todo se sentía oscuro.',
      'Conocía a este tipo que recayó después de dos años sobrio. Estaba avergonzado, pensó que había perdido todo y tenía que empezar de nuevo. Su padrino le recordó que esos dos años no fueron borrados - eran prueba de que podía hacerlo. Se levantó, usó lo que aprendió, y ahora tiene cinco años limpio.',
      'Trabajé con alguien cuya familia no le hablaba durante el primer año de recuperación. Estaba herido y quería aislarse, pero siguió yendo a las reuniones de todos modos. Lentamente, consistentemente, demostró a través de sus acciones que estaba cambiando. Ahora sus hijos lo llaman otra vez, y dice que la paciencia fue la lección más difícil que jamás aprendió.',
      'Tenía un amigo que se desencadenaba cada vez que pasaba por la esquina de su antiguo dealer. En lugar de cambiar toda su ruta, comenzó a poner el número de su padrino en el teléfono antes de llegar allí. Llamaba en el momento que sentía la urgencia, hablaba, y seguía caminando. Ahora apenas nota esa esquina.',
      'Conocí a esta mujer que dijo que su mayor avance llegó cuando dejó de tratar de ser perfecta. Se había estado castigando por cada pequeño error, pensando que era débil. Su terapeuta le preguntó si le hablaría a un amigo de la manera que se hablaba a sí misma. Se dio cuenta de que la autocompasión no era rendirse - era darse la fuerza para seguir adelante.',
      'Conocía a alguien que se aferró durante meses, rechazando ayuda y tratando de hacer la recuperación solo. Estaba miserable, enojado y apenas aguantando. Finalmente se derrumbó y pidió ayuda en una reunión. Dijo que aprender a aceptar apoyo fue más difícil que limpiarse, pero hizo toda la diferencia en realmente mantenerse limpio.',
      'Trabajé con un tipo que perdió su trabajo en la recuperación temprana y sintió que el universo estaba en su contra. Estaba amargado, asustado y listo para tirar la toalla. Su padrino lo ayudó a verlo como una oportunidad para construir algo mejor. Volvió a la escuela, se certificó, y ahora ayuda a otras personas en recuperación a encontrar trabajo.',
      'Tenía una amiga que no podía manejar estar cerca del alcohol en eventos familiares. Se sentía culpable y rota, como si estuviera decepcionando a todos. Su padrino le dijo que proteger su sobriedad no era egoísta - era necesario. Comenzó a organizar sus propias reuniones sobrias, y ahora la mitad de su familia se le une porque lo prefieren.',
      'Conocí a alguien que dijo que su peor día sobrio todavía era mejor que su mejor día usando. Estaba teniendo un ataque de pánico en el trabajo, sintiéndose como si no pudiera hacer frente sin sustancias. Llamó a su padrino, hizo ejercicios de respiración, y siguió adelante. Más tarde se dio cuenta de que enfrentar sus sentimientos de frente, incluso cuando dolía, era como se veía la verdadera fuerza.',
      'Conocía a esta persona que luchó con la vergüenza durante años, convencida de que era una mala persona que no merecía la recuperación. Comenzó a hacer voluntariado en un centro de recuperación, ayudando a los recién llegados a superar sus primeros días. Ver su historia ayudar a otros a sanar le hizo darse cuenta de que no estaba rota - estaba herida, y las personas heridas pueden ayudar a otras personas heridas a sanar.',
      'Trabajé con alguien que siguió tratando de acelerar su recuperación, queriendo sentirse mejor inmediatamente. Estaba impaciente, frustrada y seguía comparándose con otros. Su padrino le recordó que la recuperación es como construir una casa - no puedes saltar los cimientos. Aprendió a celebrar pequeñas victorias y confiar en el proceso.',
      'Tenía un amigo que pensaba que la recuperación significaba estar feliz todo el tiempo. Cuando se sentía triste o enojado, entraba en pánico y pensaba que estaba fallando. Su terapeuta le enseñó que la sobriedad no se trataba de eliminar las emociones - se trataba de sentirlas sin usar. Aprender a sentarse con la incomodidad sin correr se convirtió en su superpoder.'
    ],
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    listening: 'Escuchando...',
    stopListening: 'Parar'
  },
  
  // Journey
  journey: {
    title: 'Tu Viaje',
    subtitle: 'Pista guiada de 90 días',
    day: 'Día',
    complete: 'Completar',
    locked: 'Bloqueado',
    completed: 'Completado',
    review: 'Revisar',
    start: 'Comenzar',
    overallProgress: 'Progreso General',
    journeyProgress: 'Progreso del Viaje',
    weekFoundation: 'Semana 1: Fundación',
    upcomingDays: 'Próximos 3 Días',
    dayModules: {
      day1: {
        title: 'Comenzando Tu Viaje',
        theme: 'Fundación',
        welcomeMessage: 'Bienvenido a LEAP - Tu viaje comienza aquí',
        activities: {
          welcomeAudio: 'Mensaje de Bienvenida (2 min.)',
          howRecoveryWorks: 'Cómo Funciona la Recuperación',
          yourWhy: 'Tu Por Qué'
        }
      },
      day2: {
        title: 'Entendiendo los Disparadores',
        theme: 'Conciencia'
      },
      day3: {
        title: 'Construyendo Tu Red de Apoyo',
        theme: 'Conexión'
      },
      day4: {
        title: 'Por Qué Quieres Recuperarte',
        theme: 'Motivación'
      },
      day5: {
        title: 'Nombrando al Verdadero Enemigo',
        theme: 'Identidad'
      },
      day6: {
        title: 'Creando Tu Espacio Seguro',
        theme: 'Ambiente'
      },
      day7: {
        title: 'Una Semana Fuerte – Reflexión Rápida',
        theme: 'Reflexión'
      }
    },
    notifications: {
      dayLocked: 'Día Bloqueado',
      unlock1201: 'Los días se desbloquean a las 12:01 AM cada día',
      completeFirst: 'Completa el Día {{day}} primero para desbloquear este día',
      reminderTitle: 'Recordatorio LEAP',
      reminder12h: "Te quedan 12 horas para completar el LEAP de hoy. Sigue así—lo estás haciendo genial.",
      almostThere: 'Casi Allí',
      almostThereMsg: "Casi allí. Terminemos fuerte.",
      finalHour: 'Hora Final',
      finalHourMsg: "Queda una hora hoy. ¡Vamos a DAR EL SALTO!",
      week1Complete: '¡Semana 1 Completa! 🏆',
      week1CompleteMsg: "Has desbloqueado tu Insignia de Semana 1. ¡Progreso increíble!",
      dayComplete: '¡Día {{day}} Completo! ✅',
      dayCompleteMsg: "¡Gran trabajo! Estás construyendo bases sólidas de recuperación."
    }
  },
  
  // Toolbox
  toolbox: {
    title: 'Tu Caja de Herramientas',
    titleParts: ['TU CAJA DE', 'HERRAMIENTAS'],
    subtitle: 'Tus herramientas de apoyo, siempre listas',
    stats: {
      todayTools: 'Herramientas Usadas Hoy',
      dayStreak: 'Racha de Días',
      totalSessions: 'Sesiones Totales'
    },
    emergency: {
      title: 'Ayuda de Emergencia',
      description: 'Obtén apoyo inmediato',
      button: 'Necesito Ayuda Ahora',
      badge: 'Emergencia'
    },
    tools: {
      foreman: {
        title: 'El Capataz',
        description: 'Mentor y Afirmaciones',
        badge: 'Chat IA'
      },
      urgeTracker: {
        title: 'Recuperación Redline',
        description: 'Rastrea impulsos y redirige',
        badge: 'Rastrear'
      },
      breathingExercise: {
        title: 'SteadySteel', 
        description: 'Ejercicio de respiración interactivo',
        badge: 'Calma'
      },
      gratitudeLog: {
        title: 'Diario de Gratitud',
        description: 'Enfócate en lo positivo',
        badge: 'Mentalidad'
      }
    },
    recentActivity: 'Actividad Reciente',
    recentActivityEmpty: 'Tus actividades completadas aparecerán aquí mientras uses las herramientas.',
    peerSupport: {
      title: 'APOYO ENTRE PARES',
      subtitle: 'Elige alguien con quien hablar',
      yearsInRecovery: 'Años en Recuperación:',
      status: {
        online: 'En línea',
        away: 'Ausente',
        offline: 'Desconectado'
      },
      availability: {
        availableNow: 'Disponible ahora',
        backIn15: 'De vuelta en 15 min',
        availableAt: 'Disponible a las'
      },
      actions: {
        startChat: 'Iniciar Chat',
        leaveMessage: 'Dejar Mensaje'
      },
      emergencySupport: {
        title: '¿Necesitas Apoyo Inmediato?',
        description: 'Si estás en crisis, llama a la Línea Nacional de Prevención del Suicidio',
        callButton: 'Llamar 988'
      },
      offlineConfirm: 'está desconectado actualmente. ¿Te gustaría dejar un mensaje?'
    },
    toolTitles: {
      emergencyHelp: 'Ayuda de Emergencia',
      emergencyDesc: 'Obtén apoyo inmediato',
      foremanTitle: 'El Capataz',
      foremanDesc: 'Mentor y Afirmaciones',
      redlineTitle: 'Recuperación Redline',
      redlineDesc: 'Rastrea impulsos y redirige',
      steadySteelTitle: 'SteadySteel',
      steadySteelDesc: 'Ejercicio de respiración interactivo',
      gratitudeTitle: 'Diario de Gratitud',
      gratitudeDesc: 'Enfócate en lo positivo'
    },
    badges: {
      emergency: 'Emergencia',
      aiChat: 'Chat IA',
      track: 'Rastrear',
      calm: 'Calma',
      mindset: 'Mentalidad'
    }
  },
  
  // Profile
  profile: {
    title: "TU PERFIL",
    subtitle: "Rastrea tu progreso y logros",
    memberSince: "Miembro desde {{date}}",
    lastLogin: "Último acceso: {{date}}",
    recoveryStreak: "Racha de Recuperación",
    totalToolsUsed: "Total de Herramientas Usadas",
    urgesTracked: "Impulsos Rastreados",
    thisWeek: "esta semana",
    days: "días",
    times: "veces",
    mostUsedTool: "Herramienta Más Usada:",
    weeklyProgress: "Progreso Semanal:",
    tracked: "% rastreado",
    favorites: "Herramientas Favoritas",
    achievements: "Logros", 
    earned: "Obtenido {{time}}",
    badges: {
      weekWarrior: "Guerrero Semanal",
      steadyBreather: "Respirador Constante",
      toolMaster: "Maestro de Herramientas"
    },
    months: {
      january: "Enero",
      february: "Febrero",
      march: "Marzo", 
      april: "Abril",
      may: "Mayo",
      june: "Junio",
      july: "Julio",
      august: "Agosto",
      september: "Septiembre",
      october: "Octubre",
      november: "Noviembre",
      december: "Diciembre"
    },
    tools: {
      steadySteel: "Acero Firme",
      peerChat: "Chat de Pares",
      foremanChat: "El Capataz", 
      urgeTracker: "Recuperación Línea Roja",
      gratitudeLog: "Registro de Gratitud",
      breathingExercise: "Acero Firme",
      noneYet: "Ninguno aún"
    },
    settings: "Configuraciones",
    editProfile: "Editar Perfil",
    notificationSettings: "Configuración de Notificaciones",
    weeklyCheckIn: "Chequeo Semanal"
  },

  // Peer Chat
  peerChat: {
    secureChat: 'Chat Seguro y Confidencial',
    online: 'En línea',
    away: 'Ausente',
    offline: 'Desconectado',
    typing: '{{name}} está escribiendo...',
    typingPlaceholder: 'Escribe tu mensaje...',
    quickActions: {
      needSupport: 'Necesito Apoyo',
      feelingTriggered: 'Me Siento Disparado',
      goodDay: 'Buen Día Hoy',
      question: 'Pregunta'
    },
    checkIn: {
      title: 'Chequeo Semanal Disponible',
      subtitle: 'Programa con {{name}}',
      button: 'Programar'
    },
    unavailable: {
      calls: 'Este especialista no está disponible para llamadas ahora.',
      video: 'Este especialista no está disponible para videollamadas ahora.'
    }
  },

  // Calendar
  calendar: {
    title: "CALENDARIO DE RECUPERACIÓN",
    subtitle: "Rastrea tu progreso",
    currentStreak: "Racha Actual",
    keepUp: "¡Sigue con el gran trabajo!",
    recoveryDays: "Tus Días de Recuperación",
    recoveryDay: "Día de Recuperación",
    greatJob: "¡Gran trabajo manteniéndote fuerte!",
    noRecoveryDay: "No hay día de recuperación registrado",
    legend: "Leyenda",
    today: "Hoy"
  },

  // Edit Profile
  editProfile: {
    title: "EDITAR PERFIL",
    firstName: "Nombre",
    phoneNumber: "Número de Teléfono",
    firstNamePlaceholder: "Ingresa tu nombre",
    phoneNumberPlaceholder: "(555) 123-4567",
    firstNameRequired: "El nombre es requerido",
    phoneNumberInvalid: "El número de teléfono debe tener 10 dígitos",
    updating: "Actualizando...",
    updateProfile: "Actualizar Perfil",
    updateSuccess: "¡Perfil actualizado exitosamente!",
    updateError: "Error al actualizar el perfil. Inténtalo de nuevo."
  },

  // Notifications
  notifications: {
    title: "CONFIGURACIÓN DE NOTIFICACIONES",
    dailyCheckIns: "Chequeos Diarios",
    morningCheckIn: "Chequeo Matutino",
    morningCheckInDesc: "Recuerda comenzar tu día bien",
    reminderTime: "Hora del Recordatorio",
    recoverySupport: "Apoyo de Recuperación",
    peerMessages: "Mensajes de Compañeros",
    peerMessagesDesc: "Notificaciones de especialistas pares",
    weeklyProgress: "Progreso Semanal",
    weeklyCheckIn: "Chequeo Semanal",
    weeklyCheckInDesc: "Revisa tu progreso y establece metas",
    notificationMethod: "Método de Notificación",
    pushNotifications: "Notificaciones Push",
    pushNotificationsDesc: "Recibe notificaciones en este dispositivo",
    smsNotifications: "Notificaciones SMS",
    smsNotificationsDesc: "Alertas y recordatorios por mensaje de texto",
    saveSettings: "Guardar Configuración"
  },

  // Breathing Exercise
  breathing: {
    title: "SteadySteel",
    subtitle: "¿Sientes esa presión en el pecho? Vamos a aliviarla.",
    sessionLength: "Duración de la Sesión:",
    backgroundSound: "Sonido de Fondo",
    voiceGuide: "Guía de Voz (Mujer Británica)",
    startSession: "Iniciar Sesión",
    close: "Cerrar",
    inhale: "Inhalar",
    hold: "Mantener",
    exhale: "Exhalar",
    rest: "Descansar",
    breathCycle: "Ciclo de Respiración:",
    voicePrompts: {
      inhale: "Inhala lenta y constantemente",
      hold: "Manténlo, quédate conmigo",
      exhale: "Ahora exhala, deja que esa tensión se vaya",
      rest: "Estás estable, estás sólido"
    },
    completionMessages: [
      "Así se siente desacelerar. Trabajo sólido.",
      "Buena decisión. Acabas de reiniciar tu sistema.",
      "Respiración constante, mente constante. Bien hecho."
    ],
    backgroundSounds: [
      "Zumbido del Taller",
      "Viento de Texas Occidental",
      "Crepitar de Fogata",
      "Modo Silencioso"
    ]
  },

  // Urge Tracker
  urgeTracker: {
    title: "Recuperación Redline",
    subtitle: "Vamos a rastrear lo que sientes y encontrar el apoyo adecuado.",
    whatUrge: "¿Qué impulso sientes de hacer?",
    howStrong: "¿Qué tan fuerte es ahora?",
    whatsBehind: "¿Qué hay detrás de esto?",
    redirect: "Vamos a redirigir esta energía.",
    closeForNow: "Cerrar por Ahora",
    continue: "Continuar",
    useBreathing: "Usar la Herramienta de Respiración ahora",
    hearForeman: "Escuchar al Capataz",
    checkPeer: "Consultar con tu Compañero",
    readAffirmation: "Leer una afirmación guardada",
    checkInTime: "Hora de Chequeo",
    checkInSubtitle: "¿Aún montando esa ola? Vamos a verificar.",
    actedOnUrge: "¿Actuaste sobre el impulso?",
    no: "No",
    slippedStopped: "Resbalé pero Paré",
    yes: "Sí",
    whatHelped: "¿Qué ayudó—o no?",
    whatHelpedPlaceholder: "Pensamientos rápidos sobre lo que funcionó o lo que lo hizo más difícil...",
    optionalReflection: "Reflexión opcional",
    reflectionPlaceholder: "¿Algo más en tu mente?",
    saveReflection: "Guardar Reflexión",
    skipForNow: "Omitir por Ahora",
    urgeTypes: {
      drink: "Beber",
      use: "Usar",
      rage: "Rabia",
      isolate: "Aislar",
      porn: "Ver Pornografía",
      overeat: "Comer en Exceso",
      other: "Otro"
    },
    triggers: {
      stress: "Estrés",
      shame: "Vergüenza",
      loneliness: "Soledad",
      anger: "Ira",
      exhaustion: "Agotamiento",
      boredom: "Aburrimiento",
      unknown: "Desconocido"
    },
    intensityLabels: {
      mild: "Leve",
      moderate: "Moderado",
      strong: "Fuerte",
      redZone: "Zona Roja"
    }
  },

  // About page
  about: {
    title: 'ACERCA DE',
    subtitle: 'Tu compañero de recuperación',
    mission: {
      title: 'Nuestra Misión',
      description: 'LEAP está diseñado específicamente para hombres en campos de trabajo intensivo que están navegando su viaje. Entendemos los desafíos únicos que enfrentas y proporcionamos herramientas prácticas y sin tonterías para apoyar tu progreso.'
    },
    privacy: {
      title: 'Tu Privacidad Importa',
      anonymity: 'Anonimato Completo:',
      anonymityDesc: 'Tu identidad está protegida. Puedes usar la aplicación sin revelar información personal.',
      communication: 'Comunicación Segura:',
      communicationDesc: 'Todos los chats con pares y chequeos están encriptados y son confidenciales.',
      judgment: 'Zona Sin Juicios:',
      judgmentDesc: 'Este es tu espacio seguro para ser honesto sobre tus luchas y victorias.'
    },
    community: {
      title: 'Apoyo Entre Pares',
      description: 'Conéctate con especialistas pares certificados que entienden tu industria y desafíos. Han caminado este sendero y están aquí para apoyarte sin juicios.'
    },
    values: {
      title: 'Nuestros Valores',
      respect: 'Respeto:',
      respectDesc: 'Tu viaje, tu ritmo, tus elecciones',
      strength: 'Fuerza:',
      strengthDesc: 'Construyendo sobre la resistencia que ya tienes',
      connection: 'Conexión:',
      connectionDesc: 'No tienes que hacer esto solo',
      progress: 'Progreso:',
      progressDesc: 'Cada paso adelante cuenta'
    },
    terms: {
      title: 'Términos y Condiciones',
      usage: 'Al usar LEAP, aceptas usar la aplicación responsablemente y respetar la privacidad de otros usuarios.',
      medical: 'Esta aplicación es una herramienta de apoyo y no reemplaza el consejo médico profesional o tratamiento.',
      emergency: 'En caso de emergencia o peligro inmediato, por favor contacta al 911 o tus servicios de emergencia locales.',
      crisis: 'Para apoyo en crisis, contacta a la Línea Nacional de Prevención del Suicidio al 988.'
    },
    footer: 'LEAP es desarrollado con orgullo por Thriving United, dedicado a apoyar la recuperación en comunidades trabajadoras.'
  },

  // Admin Dashboard
  admin: {
    title: 'ADMIN',
    dashboardTitle: 'PANEL',
    subtitle: 'Análisis de participación en recuperación',
    back: 'Atrás',
    tabs: {
      overview: 'Resumen',
      security: 'Seguridad'
    },
    timeframes: {
      week: 'Semana',
      month: 'Mes',
      quarter: 'Trimestre'
    },
    metrics: {
      totalUsers: 'Total de Usuarios',
      activeUsers: 'Usuarios Activos',
      avgStrength: 'Fuerza Promedio',
      atRisk: 'En Riesgo'
    },
    sections: {
      domainEngagement: 'Participación por Dominio',
      userRiskAssessment: 'Evaluación de Riesgo de Usuario',
      strength: 'Fuerza'
    },
    domains: {
      peerSupport: 'Apoyo Entre Pares',
      selfCare: 'Autocuidado',
      structure: 'Estructura',
      mood: 'Estado de Ánimo',
      cravingControl: 'Control de Antojos'
    },
    riskLevels: {
      high: 'ALTO',
      medium: 'MEDIO',
      low: 'BAJO'
    }
  },

  // Common
  common: {
    back: 'Atrás',
    next: 'Siguiente',
    skip: 'Saltar',
    done: 'Hecho',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    play: 'Reproducir',
    pause: 'Pausa',
    progress: 'Progreso',
    markComplete: 'Marcar Completo',
    complete: 'Completar',
    completed: 'Completado',
    continue: 'Continuar',
    of: 'de',
    min: 'min',
    day: 'Día',
    unlock: 'Completa la actividad anterior para desbloquear',
    completeDay: 'Completar Día',
    completeMore: 'Completa {{count}} más'
  }
};