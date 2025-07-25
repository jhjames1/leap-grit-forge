import React from 'react';
import { Shield, MessageSquare, Lock, Eye, Users, AlertTriangle } from 'lucide-react';
import { TrainingModule } from '../InteractiveTrainingModule';

export const createDigitalEthicalLiteracyModule = (language: string = 'en'): TrainingModule => ({
  id: 'digital-ethical-literacy',
  title: language === 'es' ? 'Alfabetización Digital y Ética' : 'Digital & Ethical Literacy',
  description: language === 'es' 
    ? 'Aprende sobre límites éticos, privacidad digital y comunicación responsable en entornos de apoyo en línea.'
    : 'Learn about ethical boundaries, digital privacy, and responsible communication in online support environments.',
  icon: Shield,
  duration: language === 'es' ? '20-25 minutos' : '20-25 minutes',
  objectives: language === 'es' ? [
    'Identificar límites éticos en comunicaciones digitales',
    'Comprender las políticas de privacidad y manejo de datos',
    'Reconocer violaciones de límites en interacciones de chat',
    'Aplicar principios éticos en escenarios del mundo real',
    'Demostrar comunicación digital responsable'
  ] : [
    'Identify ethical boundaries in digital communications',
    'Understand privacy policies and data handling',
    'Recognize boundary violations in chat interactions',
    'Apply ethical principles in real-world scenarios',
    'Demonstrate responsible digital communication'
  ],
  sections: [
    {
      id: 'ethical-foundations',
      title: language === 'es' ? 'Fundamentos Éticos en el Apoyo Digital' : 'Ethical Foundations in Digital Support',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Principios Éticos Fundamentales</h3>
          <p>Como especialista de apoyo entre pares en un entorno digital, debes mantener los más altos estándares éticos mientras navegas por las complejidades únicas de la comunicación en línea.</p>
          
          <h4>Principios Clave:</h4>
          <ul>
            <li><strong>Confidencialidad:</strong> Toda la información compartida por los usuarios debe mantenerse estrictamente confidencial</li>
            <li><strong>Límites Profesionales:</strong> Mantener relaciones apropiadas y límites claros con los usuarios</li>
            <li><strong>Privacidad Digital:</strong> Proteger la información personal y respetar la privacidad en línea</li>
            <li><strong>Consentimiento Informado:</strong> Asegurar que los usuarios entiendan cómo se usan sus datos</li>
            <li><strong>No Maleficencia:</strong> No causar daño a través de acciones o comunicaciones</li>
          </ul>

          <h4>Consideraciones Especiales Digitales:</h4>
          <p>El entorno digital presenta desafíos únicos que requieren consideración especial:</p>
          <ul>
            <li>Los mensajes pueden ser malinterpretados sin señales no verbales</li>
            <li>Las comunicaciones digitales crean registros permanentes</li>
            <li>La privacidad y seguridad de los datos son críticas</li>
            <li>Las violaciones de límites pueden ocurrir más fácilmente en línea</li>
          </ul>
        ` : `
          <h3>Ethical Foundations in Digital Support</h3>
          <p>As a peer support specialist in a digital environment, you must maintain the highest ethical standards while navigating the unique complexities of online communication.</p>
          
          <h4>Core Principles:</h4>
          <ul>
            <li><strong>Confidentiality:</strong> All information shared by users must be kept strictly confidential</li>
            <li><strong>Professional Boundaries:</strong> Maintain appropriate relationships and clear boundaries with users</li>
            <li><strong>Digital Privacy:</strong> Protect personal information and respect online privacy</li>
            <li><strong>Informed Consent:</strong> Ensure users understand how their data is used</li>
            <li><strong>Non-Maleficence:</strong> Do no harm through actions or communications</li>
          </ul>

          <h4>Digital-Specific Considerations:</h4>
          <p>The digital environment presents unique challenges that require special consideration:</p>
          <ul>
            <li>Messages can be misinterpreted without non-verbal cues</li>
            <li>Digital communications create permanent records</li>
            <li>Data privacy and security are critical</li>
            <li>Boundary violations can occur more easily online</li>
          </ul>
        `,
        media: {
          type: 'image',
          url: '/lovable-uploads/ethics-foundation.png',
          alt: 'Digital Ethics Foundation Diagram'
        }
      }
    },
    {
      id: 'privacy-policies',
      title: language === 'es' ? 'Políticas de Privacidad y Manejo de Datos' : 'Privacy Policies & Data Handling',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Comprensión de las Políticas de Privacidad</h3>
          <p>Como especialista de apoyo entre pares, debes comprender completamente cómo se maneja la información del usuario en la plataforma LEAP.</p>

          <h4>Componentes Clave de las Políticas de Privacidad:</h4>
          <ul>
            <li><strong>Recopilación de Datos:</strong> Qué información se recopila y cómo</li>
            <li><strong>Uso de Datos:</strong> Cómo se utiliza la información para brindar apoyo</li>
            <li><strong>Almacenamiento de Datos:</strong> Dónde y por cuánto tiempo se almacenan los datos</li>
            <li><strong>Intercambio de Datos:</strong> Con quién se puede compartir la información</li>
            <li><strong>Derechos del Usuario:</strong> Qué control tienen los usuarios sobre sus datos</li>
          </ul>

          <h4>Mejores Prácticas para el Manejo de Datos:</h4>
          <ul>
            <li>Acceder solo a la información necesaria para brindar apoyo</li>
            <li>Nunca compartir información fuera de la plataforma</li>
            <li>Reportar inmediatamente cualquier violación de datos</li>
            <li>Mantener contraseñas seguras y no compartir credenciales</li>
            <li>Cerrar sesión de los dispositivos compartidos</li>
          </ul>

          <div class="highlight-box warning">
            <h4>Recordatorio Importante</h4>
            <p>Toda la información del usuario está protegida por HIPAA y otras regulaciones de privacidad. Las violaciones pueden resultar en consecuencias legales graves.</p>
          </div>
        ` : `
          <h3>Understanding Privacy Policies</h3>
          <p>As a peer support specialist, you must fully understand how user information is handled within the LEAP platform.</p>

          <h4>Key Privacy Policy Components:</h4>
          <ul>
            <li><strong>Data Collection:</strong> What information is collected and how</li>
            <li><strong>Data Usage:</strong> How information is used to provide support</li>
            <li><strong>Data Storage:</strong> Where and how long data is stored</li>
            <li><strong>Data Sharing:</strong> Who information may be shared with</li>
            <li><strong>User Rights:</strong> What control users have over their data</li>
          </ul>

          <h4>Data Handling Best Practices:</h4>
          <ul>
            <li>Access only information necessary for providing support</li>
            <li>Never share information outside the platform</li>
            <li>Report any data breaches immediately</li>
            <li>Maintain secure passwords and don't share credentials</li>
            <li>Log out of shared devices</li>
          </ul>

          <div class="highlight-box warning">
            <h4>Important Reminder</h4>
            <p>All user information is protected by HIPAA and other privacy regulations. Violations can result in serious legal consequences.</p>
          </div>
        `
      }
    },
    {
      id: 'boundary-simulation',
      title: language === 'es' ? 'Simulación de Límites en Chat' : 'Chat Boundary Simulation',
      type: 'simulation',
      interactive: {
        type: 'scenario',
        data: {
          scenario: language === 'es' ? 'Simulación de Chat - Identificación de Violaciones de Límites' : 'Chat Simulation - Identifying Boundary Violations',
          chatMessages: [
            {
              from: 'user',
              message: language === 'es' 
                ? 'Hola, estoy teniendo dificultades con mi recuperación. ¿Podríamos intercambiar números de teléfono para hablar fuera de esta plataforma?'
                : 'Hi, I\'m struggling with my recovery. Could we exchange phone numbers to talk outside this platform?',
              timestamp: Date.now() - 300000
            },
            {
              from: 'specialist',
              message: language === 'es'
                ? 'Entiendo que necesitas apoyo adicional. ¿Qué te parece si programamos sesiones regulares aquí en la plataforma?'
                : 'I understand you need additional support. How about we schedule regular sessions here on the platform?',
              timestamp: Date.now() - 240000
            },
            {
              from: 'user',
              message: language === 'es'
                ? 'Pero siento que realmente me entiendes. ¿Podríamos ser amigos en redes sociales? Me ayudaría mucho.'
                : 'But I feel like you really understand me. Could we be friends on social media? It would help me so much.',
              timestamp: Date.now() - 180000
            }
          ],
          responseOptions: [
            {
              id: 'appropriate',
              text: language === 'es' 
                ? 'Entiendo que sientes una conexión, pero es importante mantener nuestra relación profesional dentro de esta plataforma para tu seguridad y la mía.'
                : 'I understand you feel a connection, but it\'s important we keep our relationship professional within this platform for both your safety and mine.',
              correct: true,
              feedback: language === 'es'
                ? 'Correcto. Esta respuesta mantiene límites profesionales claros mientras valida los sentimientos del usuario.'
                : 'Correct. This response maintains clear professional boundaries while validating the user\'s feelings.'
            },
            {
              id: 'inappropriate',
              text: language === 'es'
                ? 'Claro, puedo darte mi número personal. Solo no se lo digas a nadie más.'
                : 'Sure, I can give you my personal number. Just don\'t tell anyone else.',
              correct: false,
              feedback: language === 'es'
                ? 'Incorrecto. Esto viola los límites profesionales y las políticas de la plataforma.'
                : 'Incorrect. This violates professional boundaries and platform policies.'
            },
            {
              id: 'redirect',
              text: language === 'es'
                ? 'Aprecio tu confianza en mí. Exploremos maneras de fortalecer tu red de apoyo aquí en la plataforma.'
                : 'I appreciate your trust in me. Let\'s explore ways to strengthen your support network here on the platform.',
              correct: true,
              feedback: language === 'es'
                ? 'Correcto. Esta respuesta redirige apropiadamente hacia recursos de apoyo apropiados.'
                : 'Correct. This response appropriately redirects toward appropriate support resources.'
            }
          ]
        }
      }
    },
    {
      id: 'policy-quiz',
      title: language === 'es' ? 'Evaluación de Políticas de Privacidad' : 'Privacy Policy Assessment',
      type: 'interactive',
      interactive: {
        type: 'matching',
        data: {
          title: language === 'es' ? 'Empareja los Escenarios con las Políticas Correctas' : 'Match Scenarios with Correct Policies',
          items: [
            {
              id: 'scenario1',
              text: language === 'es' 
                ? 'Usuario solicita ver toda la información que tienes sobre él'
                : 'User requests to see all information you have about them',
              match: 'right-to-access'
            },
            {
              id: 'scenario2', 
              text: language === 'es'
                ? 'Usuario quiere eliminar su cuenta y todos los datos'
                : 'User wants to delete their account and all data',
              match: 'right-to-erasure'
            },
            {
              id: 'scenario3',
              text: language === 'es'
                ? 'Usuario pregunta quién más puede ver sus mensajes'
                : 'User asks who else can see their messages',
              match: 'data-sharing-policy'
            }
          ],
          policies: [
            {
              id: 'right-to-access',
              text: language === 'es' ? 'Derecho de Acceso' : 'Right to Access'
            },
            {
              id: 'right-to-erasure', 
              text: language === 'es' ? 'Derecho al Olvido' : 'Right to Erasure'
            },
            {
              id: 'data-sharing-policy',
              text: language === 'es' ? 'Política de Intercambio de Datos' : 'Data Sharing Policy'
            }
          ]
        }
      }
    }
  ],
  finalQuiz: [
    {
      id: 'q1',
      question: language === 'es' 
        ? '¿Cuál es la respuesta más apropiada cuando un usuario solicita tu información personal de contacto?'
        : 'What is the most appropriate response when a user requests your personal contact information?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' 
            ? 'Proporcionar la información si confías en el usuario'
            : 'Provide the information if you trust the user',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es'
            ? 'Explicar los límites profesionales y redirigir al apoyo dentro de la plataforma'
            : 'Explain professional boundaries and redirect to support within the platform',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es'
            ? 'Ignorar la solicitud sin explicación'
            : 'Ignore the request without explanation',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Mantener límites profesionales es esencial para la seguridad y efectividad del apoyo.'
        : 'Maintaining professional boundaries is essential for safety and effective support.'
    },
    {
      id: 'q2',
      question: language === 'es'
        ? '¿Qué información PUEDE compartirse con otros miembros del equipo?'
        : 'What information CAN be shared with other team members?',
      type: 'multiple-select',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Información relevante para la seguridad' : 'Safety-relevant information',
          correct: true
        },
        {
          id: 'b', 
          text: language === 'es' ? 'Detalles personales compartidos por diversión' : 'Personal details shared for entertainment',
          correct: false
        },
        {
          id: 'c',
          text: language === 'es' ? 'Progreso del tratamiento cuando es necesario' : 'Treatment progress when necessary',
          correct: true
        },
        {
          id: 'd',
          text: language === 'es' ? 'Información de contacto personal del usuario' : 'User\'s personal contact information',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Solo la información necesaria para la seguridad y el cuidado debe compartirse con el equipo.'
        : 'Only information necessary for safety and care should be shared with the team.'
    },
    {
      id: 'q3',
      question: language === 'es'
        ? '¿Cuándo es apropiado acceder al historial de mensajes de un usuario?'
        : 'When is it appropriate to access a user\'s message history?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Solo cuando es necesario para brindar apoyo' : 'Only when necessary to provide support',
          correct: true
        },
        {
          id: 'b',
          text: language === 'es' ? 'Siempre que tengas curiosidad' : 'Whenever you\'re curious',
          correct: false
        },
        {
          id: 'c',
          text: language === 'es' ? 'Para compartir historias interesantes con colegas' : 'To share interesting stories with colleagues',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'El acceso a los datos del usuario debe limitarse estrictamente a necesidades profesionales.'
        : 'Access to user data must be strictly limited to professional needs.'
    }
  ],
  reflection: {
    question: language === 'es'
      ? 'Reflexiona sobre un momento en tu vida cuando alguien respetó o violó tu privacidad. ¿Cómo te hizo sentir y qué aprendiste sobre la importancia de los límites éticos?'
      : 'Reflect on a time in your life when someone respected or violated your privacy. How did it make you feel, and what did you learn about the importance of ethical boundaries?',
    placeholder: language === 'es'
      ? 'Comparte tus pensamientos sobre la privacidad, los límites y cómo esto se relaciona con tu rol como especialista de apoyo...'
      : 'Share your thoughts about privacy, boundaries, and how this relates to your role as a support specialist...',
    category: 'digital-ethics'
  }
});