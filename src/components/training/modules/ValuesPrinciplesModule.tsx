import * as React from 'react';
import { Heart, Star, Compass, Users, Award } from 'lucide-react';
import { TrainingModule } from '../InteractiveTrainingModule';

export const createValuesPrinciplesModule = (language: string = 'en'): TrainingModule => ({
  id: 'values-principles',
  title: language === 'es' ? 'Valores y Principios del Apoyo Entre Pares' : 'Values & Principles of Peer Support',
  description: language === 'es' 
    ? 'Explora los valores fundamentales y principios éticos que guían el trabajo de apoyo entre pares efectivo.'
    : 'Explore the core values and ethical principles that guide effective peer support work.',
  icon: Compass,
  duration: language === 'es' ? '15-20 minutos' : '15-20 minutes',
  objectives: language === 'es' ? [
    'Identificar los valores fundamentales del apoyo entre pares',
    'Comprender cómo aplicar principios en situaciones reales',
    'Reconocer estos valores en tu propia experiencia de vida',
    'Demostrar valores a través de comunicación y acciones',
    'Integrar principios en tu práctica diaria'
  ] : [
    'Identify core values of peer support',
    'Understand how to apply principles in real situations',
    'Recognize these values in your own life experience',
    'Demonstrate values through communication and actions',
    'Integrate principles into your daily practice'
  ],
  sections: [
    {
      id: 'core-values',
      title: language === 'es' ? 'Valores Fundamentales del Apoyo Entre Pares' : 'Core Values of Peer Support',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Los Valores que Nos Guían</h3>
          <p>Los valores del apoyo entre pares están profundamente arraigados en la experiencia vivida y el crecimiento personal. Estos valores informan cada interacción y decisión en tu trabajo de apoyo.</p>
          
          <h4>Esperanza y Recuperación</h4>
          <p><strong>Definición:</strong> La creencia inquebrantable de que la recuperación es posible para todos, sin importar dónde se encuentren en su viaje.</p>
          <ul>
            <li>Modelar esperanza a través de tu propia historia de recuperación</li>
            <li>Enfocar en las fortalezas y posibilidades, no solo en los problemas</li>
            <li>Ayudar a otros a vislumbrar un futuro diferente para sí mismos</li>
            <li>Celebrar pequeñas victorias y pasos hacia adelante</li>
          </ul>

          <h4>Autodeterminación y Empoderamiento</h4>
          <p><strong>Definición:</strong> Reconocer y respetar el derecho de cada persona a tomar sus propias decisiones sobre su vida y recuperación.</p>
          <ul>
            <li>Apoyar las decisiones de los usuarios, incluso cuando no estés de acuerdo</li>
            <li>Ofrecer información y opciones, no directivas</li>
            <li>Fomentar la confianza en sí mismo y las habilidades de toma de decisiones</li>
            <li>Respetar el ritmo y estilo de recuperación único de cada persona</li>
          </ul>

          <h4>Mutualidad y Reciprocidad</h4>
          <p><strong>Definición:</strong> Reconocer que tanto el que da como el que recibe apoyo pueden beneficiarse y aprender el uno del otro.</p>
          <ul>
            <li>Compartir abiertamente tus propias experiencias y luchas</li>
            <li>Aprender de cada persona que apoyas</li>
            <li>Evitar dinámicas de "experto/cliente"</li>
            <li>Reconocer la sabiduría que viene de la experiencia vivida</li>
          </ul>

          <h4>Responsabilidad Personal y Mutua</h4>
          <p><strong>Definición:</strong> Aceptar la responsabilidad tanto por tu propia recuperación continua como por apoyar a otros en su viaje.</p>
          <ul>
            <li>Mantener tu propio bienestar y crecimiento continuo</li>
            <li>Ser responsable de tus acciones y compromisos</li>
            <li>Fomentar la responsabilidad en otros sin ser controlador</li>
            <li>Crear un entorno donde la responsabilidad mutua sea segura</li>
          </ul>
        ` : `
          <h3>The Values That Guide Us</h3>
          <p>Peer support values are deeply rooted in lived experience and personal growth. These values inform every interaction and decision in your support work.</p>
          
          <h4>Hope and Recovery</h4>
          <p><strong>Definition:</strong> The unwavering belief that recovery is possible for everyone, no matter where they are in their journey.</p>
          <ul>
            <li>Model hope through your own recovery story</li>
            <li>Focus on strengths and possibilities, not just problems</li>
            <li>Help others envision a different future for themselves</li>
            <li>Celebrate small victories and forward steps</li>
          </ul>

          <h4>Self-Determination and Empowerment</h4>
          <p><strong>Definition:</strong> Recognizing and respecting each person's right to make their own decisions about their life and recovery.</p>
          <ul>
            <li>Support user decisions even when you disagree</li>
            <li>Offer information and options, not directives</li>
            <li>Foster self-confidence and decision-making skills</li>
            <li>Respect each person's unique recovery pace and style</li>
          </ul>

          <h4>Mutuality and Reciprocity</h4>
          <p><strong>Definition:</strong> Recognizing that both the giver and receiver of support can benefit and learn from each other.</p>
          <ul>
            <li>Share openly about your own experiences and struggles</li>
            <li>Learn from each person you support</li>
            <li>Avoid "expert/client" dynamics</li>
            <li>Acknowledge the wisdom that comes from lived experience</li>
          </ul>

          <h4>Personal and Mutual Responsibility</h4>
          <p><strong>Definition:</strong> Taking responsibility for both your own continued recovery and for supporting others in their journey.</p>
          <ul>
            <li>Maintain your own wellness and continued growth</li>
            <li>Be accountable for your actions and commitments</li>
            <li>Encourage accountability in others without being controlling</li>
            <li>Create an environment where mutual responsibility is safe</li>
          </ul>
        `,
        media: {
          type: 'image',
          url: '/lovable-uploads/peer-values.png',
          alt: 'Core Values of Peer Support'
        }
      }
    },
    {
      id: 'values-matching',
      title: language === 'es' ? 'Emparejando Valores con Ejemplos' : 'Matching Values with Examples',
      type: 'interactive',
      interactive: {
        type: 'matching',
        data: {
          title: language === 'es' ? 'Conecta cada valor con su ejemplo del mundo real' : 'Connect each value with its real-world example',
          instruction: language === 'es' 
            ? 'Arrastra cada declaración de valor a su ejemplo correspondiente'
            : 'Drag each value statement to its corresponding example',
          values: [
            {
              id: 'hope',
              text: language === 'es' ? 'Esperanza y Recuperación' : 'Hope and Recovery',
              description: language === 'es' 
                ? 'La creencia de que la recuperación es posible'
                : 'The belief that recovery is possible'
            },
            {
              id: 'mutuality',
              text: language === 'es' ? 'Mutualidad' : 'Mutuality',
              description: language === 'es'
                ? 'Relaciones bidireccionales de aprendizaje'
                : 'Two-way learning relationships'
            },
            {
              id: 'self-determination',
              text: language === 'es' ? 'Autodeterminación' : 'Self-Determination',
              description: language === 'es'
                ? 'Respetar las decisiones de los usuarios'
                : 'Respecting user decisions'
            },
            {
              id: 'responsibility',
              text: language === 'es' ? 'Responsabilidad' : 'Responsibility',
              description: language === 'es'
                ? 'Ser responsable de tu propio crecimiento'
                : 'Being accountable for your own growth'
            }
          ],
          examples: [
            {
              id: 'hope-example',
              text: language === 'es' 
                ? '"Yo también pasé por momentos oscuros, pero mira dónde estoy ahora. Tú también puedes llegar ahí."'
                : '"I went through dark times too, but look where I am now. You can get there too."',
              matchesValue: 'hope'
            },
            {
              id: 'mutuality-example',
              text: language === 'es'
                ? '"Tu perspectiva sobre esto me ayuda a ver mi propia experiencia de manera diferente."'
                : '"Your perspective on this helps me see my own experience differently."',
              matchesValue: 'mutuality'
            },
            {
              id: 'self-determination-example',
              text: language === 'es'
                ? '"Entiendo que no estás listo para ese paso todavía. Exploremos otras opciones."'
                : '"I understand you\'re not ready for that step yet. Let\'s explore other options."',
              matchesValue: 'self-determination'
            },
            {
              id: 'responsibility-example',
              text: language === 'es'
                ? '"Necesito tomarme un descanso para cuidar mi propio bienestar primero."'
                : '"I need to take a break to care for my own wellness first."',
              matchesValue: 'responsibility'
            }
          ]
        }
      }
    },
    {
      id: 'values-reflection',
      title: language === 'es' ? 'Reflexión sobre Valores Personales' : 'Personal Values Reflection',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Conectando Valores con Tu Experiencia Vivida</h3>
          <p>Los valores del apoyo entre pares cobran vida cuando los conectas con tu propia experiencia de recuperación. Reflexiona sobre cómo estos valores se han manifestado en tu viaje.</p>
          
          <h4>Preguntas para la Reflexión Personal:</h4>
          
          <h5>Esperanza y Recuperación:</h5>
          <ul>
            <li>¿Quién te ofreció esperanza cuando más la necesitabas?</li>
            <li>¿Cómo modeló esa persona que la recuperación era posible?</li>
            <li>¿Qué te ayudó a mantener la esperanza durante los momentos difíciles?</li>
          </ul>

          <h5>Autodeterminación:</h5>
          <ul>
            <li>¿Cuándo te sentiste más empoderado en tu recuperación?</li>
            <li>¿Hubo momentos cuando otros respetaron tus decisiones incluso cuando no estaban de acuerdo?</li>
            <li>¿Cómo te sentiste cuando tuviste control sobre tu propio proceso de recuperación?</li>
          </ul>

          <h5>Mutualidad:</h5>
          <ul>
            <li>¿Cuándo has aprendido tanto de alguien como les has dado?</li>
            <li>¿Qué relaciones en tu recuperación se sintieron más igualitarias?</li>
            <li>¿Cómo te ha beneficiado ayudar a otros?</li>
          </ul>

          <h5>Responsabilidad:</h5>
          <ul>
            <li>¿Cuándo tomaste plena responsabilidad de tu recuperación?</li>
            <li>¿Cómo equilibras cuidar de ti mismo con apoyar a otros?</li>
            <li>¿Qué significa la responsabilidad mutua en tus relaciones?</li>
          </ul>

          <div class="highlight-box info">
            <h4>Tu Historia Es Tu Fortaleza</h4>
            <p>Tu experiencia vivida de estos valores te da credibilidad y autenticidad únicas en tu trabajo de apoyo entre pares.</p>
          </div>
        ` : `
          <h3>Connecting Values to Your Lived Experience</h3>
          <p>Peer support values come alive when you connect them to your own recovery experience. Reflect on how these values have manifested in your journey.</p>
          
          <h4>Questions for Personal Reflection:</h4>
          
          <h5>Hope and Recovery:</h5>
          <ul>
            <li>Who offered you hope when you needed it most?</li>
            <li>How did that person model that recovery was possible?</li>
            <li>What helped you maintain hope during difficult times?</li>
          </ul>

          <h5>Self-Determination:</h5>
          <ul>
            <li>When did you feel most empowered in your recovery?</li>
            <li>Were there times when others respected your decisions even when they disagreed?</li>
            <li>How did it feel when you had control over your own recovery process?</li>
          </ul>

          <h5>Mutuality:</h5>
          <ul>
            <li>When have you learned as much from someone as you gave them?</li>
            <li>What relationships in your recovery felt most equal?</li>
            <li>How has helping others benefited you?</li>
          </ul>

          <h5>Responsibility:</h5>
          <ul>
            <li>When did you take full responsibility for your recovery?</li>
            <li>How do you balance caring for yourself with supporting others?</li>
            <li>What does mutual responsibility mean in your relationships?</li>
          </ul>

          <div class="highlight-box info">
            <h4>Your Story Is Your Strength</h4>
            <p>Your lived experience of these values gives you unique credibility and authenticity in your peer support work.</p>
          </div>
        `
      }
    },
    {
      id: 'values-application',
      title: language === 'es' ? 'Aplicando Valores en la Práctica' : 'Applying Values in Practice',
      type: 'simulation',
      interactive: {
        type: 'scenario',
        data: {
          scenario: language === 'es' ? 'Aplicación de Valores - Situación Desafiante' : 'Values Application - Challenging Situation',
          description: language === 'es' 
            ? 'Un usuario está tomando decisiones que tú crees que podrían ser perjudiciales para su recuperación. ¿Cómo aplicas los valores del apoyo entre pares?'
            : 'A user is making decisions that you believe might be harmful to their recovery. How do you apply peer support values?',
          chatMessages: [
            {
              from: 'user',
              message: language === 'es' 
                ? 'He decidido dejar mi programa de tratamiento. Sé que piensas que es una mala idea, pero me siento listo para hacerlo por mi cuenta.'
                : 'I\'ve decided to leave my treatment program. I know you think it\'s a bad idea, but I feel ready to do this on my own.',
              timestamp: Date.now() - 120000
            }
          ],
          responseOptions: [
            {
              id: 'respect-choice',
              text: language === 'es' 
                ? 'Respeto tu derecho a tomar esta decisión. ¿Puedes contarme qué te lleva a sentir que estás listo? Me gustaría entender tu perspectiva.'
                : 'I respect your right to make this decision. Can you tell me what leads you to feel you\'re ready? I\'d like to understand your perspective.',
              values: ['self-determination', 'mutuality'],
              correct: true,
              feedback: language === 'es'
                ? 'Excelente. Esta respuesta respeta la autodeterminación mientras mantiene la mutualidad.'
                : 'Excellent. This response respects self-determination while maintaining mutuality.'
            },
            {
              id: 'argue-against',
              text: language === 'es'
                ? 'Creo que estás cometiendo un gran error. Deberías quedarte en el programa hasta que yo sienta que estás listo.'
                : 'I think you\'re making a big mistake. You should stay in the program until I feel you\'re ready.',
              values: [],
              correct: false,
              feedback: language === 'es'
                ? 'Esta respuesta va en contra de la autodeterminación y crea una dinámica de experto/cliente.'
                : 'This response goes against self-determination and creates an expert/client dynamic.'
            },
            {
              id: 'share-experience',
              text: language === 'es'
                ? 'Puedo compartir que en mi experiencia, hubo veces que dejé el tratamiento demasiado pronto. ¿Te gustaría escuchar sobre eso y explorar juntos lo que sientes?'
                : 'I can share that in my experience, there were times I left treatment too early. Would you like to hear about that and explore together what you\'re feeling?',
              values: ['mutuality', 'hope', 'responsibility'],
              correct: true,
              feedback: language === 'es'
                ? 'Buena respuesta. Compartes experiencia mientras respetas su decisión y ofreces apoyo mutuo.'
                : 'Good response. You share experience while respecting their decision and offering mutual support.'
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
        ? '¿Cuál es el valor fundamental que diferencia el apoyo entre pares de otros servicios?'
        : 'What is the core value that differentiates peer support from other services?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' 
            ? 'Capacitación profesional'
            : 'Professional training',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es'
            ? 'Experiencia vivida compartida'
            : 'Shared lived experience',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es'
            ? 'Autoridad médica'
            : 'Medical authority',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'La experiencia vivida compartida es lo que hace único al apoyo entre pares.'
        : 'Shared lived experience is what makes peer support unique.'
    },
    {
      id: 'q2',
      question: language === 'es'
        ? '¿Qué valores del apoyo entre pares se demuestran cuando respetas la decisión de un usuario con la que no estás de acuerdo?'
        : 'Which peer support values are demonstrated when you respect a user\'s decision you disagree with?',
      type: 'multiple-select',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Autodeterminación' : 'Self-determination',
          correct: true
        },
        {
          id: 'b', 
          text: language === 'es' ? 'Control profesional' : 'Professional control',
          correct: false
        },
        {
          id: 'c',
          text: language === 'es' ? 'Empoderamiento' : 'Empowerment',
          correct: true
        },
        {
          id: 'd',
          text: language === 'es' ? 'Responsabilidad personal' : 'Personal responsibility',
          correct: true
        }
      ],
      explanation: language === 'es'
        ? 'Respetar las decisiones de los usuarios demuestra autodeterminación, empoderamiento y responsabilidad personal.'
        : 'Respecting user decisions demonstrates self-determination, empowerment, and personal responsibility.'
    },
    {
      id: 'q3',
      question: language === 'es'
        ? '¿Cómo se manifiesta la mutualidad en el apoyo entre pares?'
        : 'How is mutuality manifested in peer support?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Mantienes distancia profesional' : 'You maintain professional distance',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es' ? 'Tanto tú como el usuario aprenden el uno del otro' : 'Both you and the user learn from each other',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'Proporcionas todas las respuestas' : 'You provide all the answers',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'La mutualidad significa que tanto el especialista como el usuario se benefician y aprenden de la relación.'
        : 'Mutuality means both the specialist and user benefit and learn from the relationship.'
    }
  ],
  reflection: {
    question: language === 'es'
      ? 'Describe un momento en tu vida cuando alguien demostró uno de estos valores contigo (esperanza, autodeterminación, mutualidad, o responsabilidad). ¿Cómo te impactó esta experiencia y cómo planeas incorporar este valor en tu trabajo de apoyo entre pares?'
      : 'Describe a time in your life when someone demonstrated one of these values with you (hope, self-determination, mutuality, or responsibility). How did this experience impact you, and how do you plan to incorporate this value into your peer support work?',
    placeholder: language === 'es'
      ? 'Reflexiona sobre cómo los valores del apoyo entre pares se han manifestado en tu propia vida y cómo los aplicarás...'
      : 'Reflect on how peer support values have manifested in your own life and how you will apply them...',
    category: 'values-principles'
  }
});