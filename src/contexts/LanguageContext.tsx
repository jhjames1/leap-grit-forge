import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, interpolations?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('leap-language');
    return (stored as Language) || 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('leap-language', newLanguage);
  };

  const t = (key: string, interpolations?: Record<string, string | number>): string => {
    return getTranslation(key, language, interpolations);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

// English translations
const englishTranslations = {
  // User Auth
  auth: {
    welcome: {
      title: 'Welcome to LEAP',
      subtitle: 'Enter your first name to get started'
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
      title: 'What brings you to LEAP today?',
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
    evening: 'evening',
    gladYoureHere: 'I\'m glad you\'re here.',
    button: {
      letsLeap: 'Let\'s LEAP'
    }
  },

  // Navigation
  nav: {
    home: 'Home',
    journey: 'Journey',
    toolbox: 'Toolbox',
    chat: 'Chat',
    profile: 'Profile',
    calendar: 'Calendar',
    chatSupport: 'Chat Support'
  },
  
  // Home
  home: {
    welcome: 'Welcome',
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
    foreman: {
      title: 'The Foreman',
      subtitle: 'Your personal coach is here to help',
      button: 'Chat Now'
    }
  },
  
  // Foreman Chat
  foreman: {
    title: 'The Foreman',
    greeting: {
      morning: 'Morning! Ready to build something strong today?',
      afternoon: 'Afternoon! How\'s the foundation holding up?',
      evening: 'Evening! Time to review today\'s work and plan tomorrow.'
    },
    responses: {
      struggling: [
        'Tough day on the job site? That\'s normal - even the strongest beams bend before they break. Let\'s reinforce your foundation.',
        'Every construction project has setbacks. The key is not letting one bad day tear down everything you\'ve built.',
        'Struggling doesn\'t mean failing - it means you\'re human. Let\'s grab some tools and get back to work.'
      ],
      hopeful: [
        'That\'s the spirit! You\'re building something incredible, one day at a time.',
        'Love seeing that positive energy! Keep laying those bricks - your recovery is getting stronger.',
        'You\'re showing real craftsmanship in your recovery. Keep up the excellent work!'
      ],
      frustrated: [
        'Frustration is like hitting a stubborn bolt - sometimes you need different tools. Let\'s find what works.',
        'Even master builders get frustrated. The difference is they step back, reassess, and try a new approach.',
        'That frustration shows you care about the quality of your work. Let\'s channel it into progress.'
      ],
      neutral: [
        'Steady as she goes! Consistent work builds the strongest foundations.',
        'How can I help you on the job site today? Need any tools or advice?',
        'Every day you show up to work on your recovery is a victory. What\'s your plan today?'
      ]
    },
    actions: {
      toolBelt: 'Add to Tool Belt',
      fieldStory: 'Field Story',
      talkToPeer: 'Talk to Peer'
    },
    fieldStories: [
      'Worked with a crew once where a guy dropped his hammer from the third floor. Instead of getting mad, he said "Well, gravity still works!" Sometimes you gotta laugh at the setbacks.',
      'Old-timer told me: "Measure twice, cut once." Same goes for recovery - think before you act, and you\'ll waste less material.',
      'Saw a building that stood for 100 years get torn down in a day. But you know what? They used those same strong materials to build something even better.'
    ],
    placeholder: 'Type your message...',
    send: 'Send',
    listening: 'Listening...',
    stopListening: 'Stop'
  },
  
  // Journey
  journey: {
    title: 'Your Journey',
    day: 'Day',
    complete: 'Complete',
    locked: 'Locked',
    completed: 'Completed'
  },
  
  // Toolbox
  toolbox: {
    title: 'Your Toolbox',
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
    recentActivity: {
      title: 'Recent Activity',
      empty: 'Your completed activities will appear here as you use the tools.'
    }
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
    settings: "Settings",
    editProfile: "Edit Profile",
    notificationSettings: "Notification Settings",
    weeklyCheckIn: "Weekly Check-In Schedule"
  },

  // Calendar
  calendar: {
    title: "RECOVERY CALENDAR",
    subtitle: "Track your progress",
    currentStreak: "Current Streak",
    keepUp: "Keep up the great work!",
    recoveryDays: "Your Recovery Days",
    recoveryDay: "Recovery Day",
    greatJob: "Great job staying strong!",
    noRecoveryDay: "No recovery day logged",
    legend: "Legend",
    today: "Today"
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
    no: 'No'
  }
};

// Spanish translations
const spanishTranslations = {
  // User Auth
  auth: {
    welcome: {
      title: 'Bienvenido a LEAP',
      subtitle: 'Ingresa tu nombre para comenzar'
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
    chatSupport: 'Soporte de Chat'
  },
  
  // Home
  home: {
    welcome: 'Bienvenido',
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
    foreman: {
      title: 'El Capataz',
      subtitle: 'Tu entrenador personal está aquí para ayudar',
      button: 'Chatear Ahora'
    }
  },
  
  // Foreman Chat
  foreman: {
    title: 'El Capataz',
    greeting: {
      morning: '¡Buenos días! ¿Listo para construir algo fuerte hoy?',
      afternoon: '¡Buenas tardes! ¿Cómo se mantiene la base?',
      evening: '¡Buenas noches! Es hora de revisar el trabajo de hoy y planear el mañana.'
    },
    responses: {
      struggling: [
        '¿Día difícil en la obra? Es normal - hasta las vigas más fuertes se doblan antes de romperse. Vamos a reforzar tu base.',
        'Todo proyecto de construcción tiene contratiempos. La clave es no dejar que un mal día derribe todo lo que has construido.',
        'Luchar no significa fallar - significa que eres humano. Tomemos algunas herramientas y volvamos al trabajo.'
      ],
      hopeful: [
        '¡Ese es el espíritu! Estás construyendo algo increíble, un día a la vez.',
        '¡Me encanta ver esa energía positiva! Sigue poniendo esos ladrillos - tu recuperación se está fortaleciendo.',
        '¡Estás mostrando verdadera maestría en tu recuperación! ¡Sigue con el excelente trabajo!'
      ],
      frustrated: [
        'La frustración es como golpear un tornillo terco - a veces necesitas herramientas diferentes. Encontremos lo que funciona.',
        'Hasta los maestros constructores se frustran. La diferencia es que dan un paso atrás, reevalúan e intentan un nuevo enfoque.',
        'Esa frustración muestra que te importa la calidad de tu trabajo. Vamos a canalizarla hacia el progreso.'
      ],
      neutral: [
        '¡Constante como siempre! El trabajo consistente construye las bases más fuertes.',
        '¿Cómo puedo ayudarte en la obra hoy? ¿Necesitas herramientas o consejos?',
        'Cada día que te presentas a trabajar en tu recuperación es una victoria. ¿Cuál es tu plan hoy?'
      ]
    },
    actions: {
      toolBelt: 'Agregar al Cinturón',
      fieldStory: 'Historia del Campo',
      talkToPeer: 'Hablar con Compañero'
    },
    fieldStories: [
      'Trabajé con una cuadrilla una vez donde un tipo dejó caer su martillo desde el tercer piso. En lugar de enojarse, dijo "¡Bueno, la gravedad aún funciona!" A veces tienes que reírte de los contratiempos.',
      'Un veterano me dijo: "Mide dos veces, corta una vez." Lo mismo aplica para la recuperación - piensa antes de actuar, y desperdiciarás menos material.',
      'Vi un edificio que duró 100 años ser demolido en un día. ¿Pero sabes qué? Usaron esos mismos materiales fuertes para construir algo aún mejor.'
    ],
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    listening: 'Escuchando...',
    stopListening: 'Parar'
  },
  
  // Journey
  journey: {
    title: 'Tu Viaje',
    day: 'Día',
    complete: 'Completar',
    locked: 'Bloqueado',
    completed: 'Completado'
  },
  
  // Toolbox
  toolbox: {
    title: 'Tu Caja de Herramientas',
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
    recentActivity: {
      title: 'Actividad Reciente',
      empty: 'Tus actividades completadas aparecerán aquí mientras uses las herramientas.'
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
    settings: "Configuraciones",
    editProfile: "Editar Perfil",
    notificationSettings: "Configuración de Notificaciones",
    weeklyCheckIn: "Chequeo Semanal"
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
    no: 'No'
  }
};