import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
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

  const t = (key: string): string => {
    return getTranslation(key, language);
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
function getTranslation(key: string, language: Language): string {
  const translations = language === 'es' ? spanishTranslations : englishTranslations;
  
  // Navigate nested keys (e.g., "foreman.greeting")
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  // Fallback to English if Spanish translation missing
  if (value === undefined && language === 'es') {
    const keys = key.split('.');
    let fallback: any = englishTranslations;
    for (const k of keys) {
      fallback = fallback?.[k];
      if (fallback === undefined) break;
    }
    return fallback || key;
  }
  
  return value || key;
}

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
    profile: 'Profile'
  },
  
  // Dashboard Home
  home: {
    welcome: 'Welcome back',
    motivation: {
      headers: [
        'Every Day is a Fresh Start',
        'You Are Stronger Than You Know',
        'Progress Over Perfection',
        'One Day at a Time',
        'Believe in Your Journey'
      ]
    },
    streak: {
      days: 'Days Strong',
      today: 'Today'
    },
    badges: {
      earned: 'Badges Earned',
      activities: 'Activities Completed'
    },
    startDay: 'Start Your Day',
    comingUp: 'Coming Up This Week',
    foreman: {
      title: 'The Foreman',
      subtitle: 'Your recovery coach is here to help',
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
    title: 'Your Recovery Journey',
    day: 'Day',
    complete: 'Complete',
    locked: 'Locked',
    completed: 'Completed'
  },
  
  // Toolbox
  toolbox: {
    title: 'Recovery Toolbox',
    urgeTracker: 'Urge Tracker',
    breathingExercise: 'Breathing Exercise',
    gratitudeLog: 'Gratitude Log',
    recoveryStrength: 'Recovery Strength'
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
    profile: 'Perfil'
  },
  
  // Dashboard Home
  home: {
    welcome: 'Bienvenido de nuevo',
    motivation: {
      headers: [
        'Cada Día es un Nuevo Comienzo',
        'Eres Más Fuerte de lo que Crees',
        'Progreso Sobre Perfección',
        'Un Día a la Vez',
        'Cree en tu Camino'
      ]
    },
    streak: {
      days: 'Días Fuerte',
      today: 'Hoy'
    },
    badges: {
      earned: 'Insignias Ganadas',
      activities: 'Actividades Completadas'
    },
    startDay: 'Comienza tu Día',
    comingUp: 'Próximamente Esta Semana',
    foreman: {
      title: 'El Capataz',
      subtitle: 'Tu entrenador de recuperación está aquí para ayudar',
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
    title: 'Tu Viaje de Recuperación',
    day: 'Día',
    complete: 'Completar',
    locked: 'Bloqueado',
    completed: 'Completado'
  },
  
  // Toolbox
  toolbox: {
    title: 'Caja de Herramientas de Recuperación',
    urgeTracker: 'Rastreador de Impulsos',
    breathingExercise: 'Ejercicio de Respiración',
    gratitudeLog: 'Diario de Gratitud',
    recoveryStrength: 'Fuerza de Recuperación'
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