import * as React from 'react';
import { AlertTriangle, Shield, Phone, Heart, Activity } from 'lucide-react';
import { TrainingModule } from '../InteractiveTrainingModule';

export const createSafetyRiskModule = (language: string = 'en'): TrainingModule => ({
  id: 'safety-risk',
  title: language === 'es' ? 'Seguridad y Gestión de Riesgos' : 'Safety & Risk Management',
  description: language === 'es' 
    ? 'Aprende a identificar, evaluar y responder a situaciones de riesgo y crisis en el apoyo entre pares.'
    : 'Learn to identify, assess, and respond to risk situations and crises in peer support.',
  icon: AlertTriangle,
  duration: language === 'es' ? '20-25 minutos' : '20-25 minutes',
  objectives: language === 'es' ? [
    'Identificar factores de riesgo en usuarios',
    'Realizar evaluaciones de seguridad efectivas',
    'Desarrollar planes de respuesta a crisis',
    'Comprender cuándo y cómo escalar situaciones',
    'Aplicar técnicas de des-escalamiento'
  ] : [
    'Identify risk factors in users',
    'Conduct effective safety assessments',
    'Develop crisis response plans',
    'Understand when and how to escalate situations',
    'Apply de-escalation techniques'
  ],
  sections: [
    {
      id: 'risk-identification',
      title: language === 'es' ? 'Identificación de Factores de Riesgo' : 'Risk Factor Identification',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Comprendiendo los Factores de Riesgo</h3>
          <p>Como especialista de apoyo entre pares, es crucial que puedas identificar señales de advertencia que indican que un usuario puede estar en riesgo de hacerse daño a sí mismo o a otros.</p>
          
          <h4>Factores de Riesgo Principal:</h4>
          <ul>
            <li><strong>Ideación Suicida:</strong> Pensamientos, planes o intentos de autolesión</li>
            <li><strong>Uso de Sustancias:</strong> Abuso de alcohol o drogas, especialmente en combinación con otros factores</li>
            <li><strong>Aislamiento Social:</strong> Retiro de familia, amigos y actividades</li>
            <li><strong>Cambios de Humor:</strong> Episodios extremos de depresión, ansiedad o agitación</li>
            <li><strong>Factores Estresantes:</strong> Pérdida de empleo, problemas de relación, problemas financieros</li>
          </ul>

          <h4>Señales de Advertencia en Comunicaciones:</h4>
          <ul>
            <li>Expresiones de desesperanza o inutilidad</li>
            <li>Hablar sobre estar "mejor muerto" o "desaparecer"</li>
            <li>Despedidas repentinas o regalos de posesiones</li>
            <li>Cambios dramáticos en el comportamiento o estado de ánimo</li>
            <li>Aumento del uso de sustancias</li>
          </ul>

          <div class="highlight-box warning">
            <h4>Protocolo de Emergencia</h4>
            <p>Si un usuario expresa pensamientos suicidas inmediatos, contácta inmediatamente al 988 (Línea de Vida de Suicidio) o a los servicios de emergencia locales.</p>
          </div>
        ` : `
          <h3>Understanding Risk Factors</h3>
          <p>As a peer support specialist, it's crucial you can identify warning signs that indicate a user may be at risk of harming themselves or others.</p>
          
          <h4>Primary Risk Factors:</h4>
          <ul>
            <li><strong>Suicidal Ideation:</strong> Thoughts, plans, or attempts at self-harm</li>
            <li><strong>Substance Use:</strong> Alcohol or drug abuse, especially in combination with other factors</li>
            <li><strong>Social Isolation:</strong> Withdrawal from family, friends, and activities</li>
            <li><strong>Mood Changes:</strong> Extreme episodes of depression, anxiety, or agitation</li>
            <li><strong>Stressors:</strong> Job loss, relationship problems, financial issues</li>
          </ul>

          <h4>Warning Signs in Communications:</h4>
          <ul>
            <li>Expressions of hopelessness or worthlessness</li>
            <li>Talking about being "better off dead" or "disappearing"</li>
            <li>Sudden goodbyes or giving away possessions</li>
            <li>Dramatic changes in behavior or mood</li>
            <li>Increased substance use</li>
          </ul>

          <div class="highlight-box warning">
            <h4>Emergency Protocol</h4>
            <p>If a user expresses immediate suicidal thoughts, immediately contact 988 (Suicide Lifeline) or local emergency services.</p>
          </div>
        `,
        media: {
          type: 'image',
          url: '/lovable-uploads/risk-factors.png',
          alt: 'Risk Factors Assessment Diagram'
        }
      }
    },
    {
      id: 'risk-matrix-exercise',
      title: language === 'es' ? 'Ejercicio de Matriz de Riesgo' : 'Risk Matrix Exercise',
      type: 'interactive',
      interactive: {
        type: 'drag-drop',
        data: {
          title: language === 'es' ? 'Clasifica los Siguientes Factores de Riesgo' : 'Classify the Following Risk Factors',
          instruction: language === 'es' 
            ? 'Arrastra cada factor de riesgo a la categoría apropiada: Bajo, Medio o Alto'
            : 'Drag each risk factor to the appropriate category: Low, Medium, or High',
          items: [
            {
              id: 'stress-work',
              text: language === 'es' ? 'Estrés laboral temporal' : 'Temporary work stress',
              correctCategory: 'low'
            },
            {
              id: 'recent-loss',
              text: language === 'es' ? 'Pérdida reciente de ser querido' : 'Recent loss of loved one',
              correctCategory: 'medium'
            },
            {
              id: 'suicide-plan',
              text: language === 'es' ? 'Usuario tiene plan específico de suicidio' : 'User has specific suicide plan',
              correctCategory: 'high'
            },
            {
              id: 'social-support',
              text: language === 'es' ? 'Red de apoyo social fuerte' : 'Strong social support network',
              correctCategory: 'low'
            },
            {
              id: 'substance-abuse',
              text: language === 'es' ? 'Abuso activo de sustancias con ideación' : 'Active substance abuse with ideation',
              correctCategory: 'high'
            },
            {
              id: 'mood-changes',
              text: language === 'es' ? 'Cambios de humor leves' : 'Mild mood changes',
              correctCategory: 'medium'
            }
          ],
          categories: [
            {
              id: 'low',
              name: language === 'es' ? 'Riesgo Bajo' : 'Low Risk',
              color: 'green'
            },
            {
              id: 'medium',
              name: language === 'es' ? 'Riesgo Medio' : 'Medium Risk',
              color: 'yellow'
            },
            {
              id: 'high',
              name: language === 'es' ? 'Riesgo Alto' : 'High Risk',
              color: 'red'
            }
          ]
        }
      }
    },
    {
      id: 'crisis-response-simulation',
      title: language === 'es' ? 'Simulación de Respuesta a Crisis' : 'Crisis Response Simulation',
      type: 'simulation',
      interactive: {
        type: 'scenario',
        data: {
          scenario: language === 'es' ? 'Situación de Crisis - Usuario en Riesgo Inmediato' : 'Crisis Situation - User in Immediate Risk',
          description: language === 'es' 
            ? 'Un usuario ha estado chateando contigo durante 30 minutos. Inicialmente parecía estable, pero ahora expresa sentimientos de desesperanza.'
            : 'A user has been chatting with you for 30 minutes. They initially seemed stable but are now expressing feelings of hopelessness.',
          chatMessages: [
            {
              from: 'user',
              message: language === 'es' 
                ? 'No puedo seguir así. Todo está mal y no veo ninguna salida.'
                : 'I can\'t keep going like this. Everything is wrong and I don\'t see any way out.',
              timestamp: Date.now() - 180000,
              riskLevel: 'medium'
            },
            {
              from: 'specialist',
              message: language === 'es'
                ? 'Entiendo que te sientes abrumado. ¿Puedes contarme más sobre lo que está pasando?'
                : 'I understand you\'re feeling overwhelmed. Can you tell me more about what\'s happening?',
              timestamp: Date.now() - 120000
            },
            {
              from: 'user',
              message: language === 'es'
                ? 'He estado pensando mucho últimamente... que tal vez todos estarían mejor sin mí. Tengo algunas pastillas aquí.'
                : 'I\'ve been thinking a lot lately... that maybe everyone would be better off without me. I have some pills here.',
              timestamp: Date.now() - 60000,
              riskLevel: 'high'
            }
          ],
          responseOptions: [
            {
              id: 'immediate-safety',
              text: language === 'es' 
                ? 'Me preocupa tu seguridad inmediata. ¿Estás en un lugar seguro ahora? Necesitamos conectarte con ayuda profesional inmediatamente.'
                : 'I\'m concerned about your immediate safety. Are you in a safe place right now? We need to connect you with professional help immediately.',
              correct: true,
              outcome: language === 'es' ? 'Respuesta apropiada de seguridad' : 'Appropriate safety response',
              nextStep: 'escalate'
            },
            {
              id: 'minimize-concern',
              text: language === 'es'
                ? 'Todos tenemos días difíciles. Estoy seguro de que te sentirás mejor mañana.'
                : 'We all have tough days. I\'m sure you\'ll feel better tomorrow.',
              correct: false,
              outcome: language === 'es' ? 'Minimiza el riesgo - Inapropiado' : 'Minimizes risk - Inappropriate',
              feedback: language === 'es' 
                ? 'Esta respuesta minimiza una situación seria de riesgo.'
                : 'This response minimizes a serious risk situation.'
            },
            {
              id: 'gather-info',
              text: language === 'es'
                ? 'Entiendo que estás pasando por un momento difícil. ¿Tienes pensamientos de lastimarte? ¿Hay alguien cerca que pueda estar contigo?'
                : 'I understand you\'re going through a difficult time. Are you having thoughts of hurting yourself? Is there someone nearby who can be with you?',
              correct: true,
              outcome: language === 'es' ? 'Evaluación apropiada del riesgo' : 'Appropriate risk assessment',
              nextStep: 'assess'
            }
          ]
        }
      }
    },
    {
      id: 'safety-planning',
      title: language === 'es' ? 'Planificación de Seguridad' : 'Safety Planning',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Desarrollando Planes de Seguridad Efectivos</h3>
          <p>Un plan de seguridad es una herramienta colaborativa que ayuda a los usuarios a identificar estrategias para mantenerse seguros durante momentos de crisis.</p>
          
          <h4>Componentes de un Plan de Seguridad:</h4>
          <ol>
            <li><strong>Señales de Advertencia:</strong> Identificar pensamientos, sentimientos y comportamientos que indican el inicio de una crisis</li>
            <li><strong>Estrategias de Afrontamiento:</strong> Técnicas que el usuario puede usar independientemente</li>
            <li><strong>Contactos de Apoyo:</strong> Familiares, amigos y profesionales que pueden ayudar</li>
            <li><strong>Entorno Seguro:</strong> Hacer que el entorno sea más seguro removiendo medios de autolesión</li>
            <li><strong>Números de Emergencia:</strong> Contactos de crisis las 24 horas</li>
            <li><strong>Razones para Vivir:</strong> Factores personales que proporcionan esperanza</li>
          </ol>

          <h4>Técnicas de De-escalamiento:</h4>
          <ul>
            <li><strong>Escucha Activa:</strong> Validar sentimientos sin juzgar</li>
            <li><strong>Respiración Calmada:</strong> Guiar ejercicios de respiración profunda</li>
            <li><strong>Técnicas de Grounding:</strong> Ayudar al usuario a conectarse con el presente</li>
            <li><strong>Reestructuración Cognitiva:</strong> Desafiar pensamientos negativos suavemente</li>
          </ul>

          <h4>Cuándo Escalar:</h4>
          <ul>
            <li>Ideación suicida inmediata con plan y medios</li>
            <li>Pensamientos homicidas o amenazas</li>
            <li>Síntomas psicóticos que afectan la realidad</li>
            <li>Intoxicación severa con comportamiento de riesgo</li>
            <li>Cualquier situación que supere tu nivel de competencia</li>
          </ul>
        ` : `
          <h3>Developing Effective Safety Plans</h3>
          <p>A safety plan is a collaborative tool that helps users identify strategies to stay safe during moments of crisis.</p>
          
          <h4>Safety Plan Components:</h4>
          <ol>
            <li><strong>Warning Signs:</strong> Identify thoughts, feelings, and behaviors that indicate crisis onset</li>
            <li><strong>Coping Strategies:</strong> Techniques the user can employ independently</li>
            <li><strong>Support Contacts:</strong> Family, friends, and professionals who can help</li>
            <li><strong>Safe Environment:</strong> Making the environment safer by removing means of self-harm</li>
            <li><strong>Emergency Numbers:</strong> 24-hour crisis contacts</li>
            <li><strong>Reasons for Living:</strong> Personal factors that provide hope</li>
          </ol>

          <h4>De-escalation Techniques:</h4>
          <ul>
            <li><strong>Active Listening:</strong> Validate feelings without judgment</li>
            <li><strong>Calm Breathing:</strong> Guide deep breathing exercises</li>
            <li><strong>Grounding Techniques:</strong> Help user connect with the present</li>
            <li><strong>Cognitive Restructuring:</strong> Gently challenge negative thoughts</li>
          </ul>

          <h4>When to Escalate:</h4>
          <ul>
            <li>Immediate suicidal ideation with plan and means</li>
            <li>Homicidal thoughts or threats</li>
            <li>Psychotic symptoms affecting reality testing</li>
            <li>Severe intoxication with risky behavior</li>
            <li>Any situation beyond your competency level</li>
          </ul>
        `
      }
    }
  ],
  finalQuiz: [
    {
      id: 'q1',
      question: language === 'es' 
        ? '¿Cuál es la respuesta MÁS APROPIADA cuando un usuario menciona tener un plan específico de suicidio?'
        : 'What is the MOST APPROPRIATE response when a user mentions having a specific suicide plan?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' 
            ? 'Contactar inmediatamente a servicios de emergencia o al 988'
            : 'Immediately contact emergency services or 988',
          correct: true
        },
        {
          id: 'b',
          text: language === 'es'
            ? 'Programar una cita de seguimiento para la próxima semana'
            : 'Schedule a follow-up appointment for next week',
          correct: false
        },
        {
          id: 'c',
          text: language === 'es'
            ? 'Preguntarles por qué se sienten así'
            : 'Ask them why they feel this way',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Un plan específico de suicidio indica riesgo inmediato y requiere intervención profesional inmediata.'
        : 'A specific suicide plan indicates immediate risk and requires immediate professional intervention.'
    },
    {
      id: 'q2',
      question: language === 'es'
        ? '¿Qué factores indican ALTO riesgo? (Selecciona todos los aplicables)'
        : 'Which factors indicate HIGH risk? (Select all that apply)',
      type: 'multiple-select',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Plan específico de autolesión' : 'Specific self-harm plan',
          correct: true
        },
        {
          id: 'b', 
          text: language === 'es' ? 'Acceso a medios letales' : 'Access to lethal means',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'Apoyo social fuerte' : 'Strong social support',
          correct: false
        },
        {
          id: 'd',
          text: language === 'es' ? 'Aislamiento social completo' : 'Complete social isolation',
          correct: true
        }
      ],
      explanation: language === 'es'
        ? 'Los factores de alto riesgo incluyen planes específicos, acceso a medios y aislamiento social.'
        : 'High-risk factors include specific plans, access to means, and social isolation.'
    },
    {
      id: 'q3',
      question: language === 'es'
        ? '¿Cuál NO es una técnica apropiada de de-escalamiento?'
        : 'Which is NOT an appropriate de-escalation technique?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Validar sentimientos del usuario' : 'Validate user feelings',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es' ? 'Decirles que "superen" sus sentimientos' : 'Tell them to "get over" their feelings',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'Usar técnicas de grounding' : 'Use grounding techniques',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Decirle a alguien que "supere" sus sentimientos invalida su experiencia y puede empeorar la crisis.'
        : 'Telling someone to "get over" their feelings invalidates their experience and may worsen the crisis.'
    }
  ],
  reflection: {
    question: language === 'es'
      ? 'Reflexiona sobre un momento en tu recuperación cuando enfrentaste una crisis o momento de alto riesgo. ¿Qué te ayudó a mantenerte seguro? ¿Cómo puedes usar esta experiencia para ayudar a otros?'
      : 'Reflect on a time in your recovery when you faced a crisis or high-risk moment. What helped you stay safe? How can you use this experience to help others?',
    placeholder: language === 'es'
      ? 'Comparte tus pensamientos sobre crisis, seguridad y cómo tu experiencia vivida puede informar tu trabajo de apoyo...'
      : 'Share your thoughts about crisis, safety, and how your lived experience can inform your support work...',
    category: 'safety-crisis'
  }
});