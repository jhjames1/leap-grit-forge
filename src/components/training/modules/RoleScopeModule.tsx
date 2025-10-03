import React from 'react';
import { Users, Target, CheckCircle, ArrowUp, Scale } from 'lucide-react';
import { TrainingModule } from '../InteractiveTrainingModule';

export const createRoleScopeModule = (language: string = 'en'): TrainingModule => ({
  id: 'role-scope',
  title: language === 'es' ? 'Rol y Alcance de la Práctica' : 'Role & Scope of Practice',
  description: language === 'es' 
    ? 'Comprende los límites de tu rol como especialista de apoyo entre pares y cuándo escalar a profesionales.'
    : 'Understand the boundaries of your role as a peer support specialist and when to escalate to professionals.',
  icon: Target,
  duration: language === 'es' ? '15-20 minutos' : '15-20 minutes',
  objectives: language === 'es' ? [
    'Definir claramente el rol del especialista de apoyo entre pares',
    'Identificar los límites del alcance de práctica',
    'Reconocer cuándo escalar a profesionales de salud mental',
    'Comprender la diferencia entre apoyo entre pares y terapia',
    'Aplicar el conocimiento del alcance en escenarios prácticos'
  ] : [
    'Clearly define the peer support specialist role',
    'Identify scope of practice boundaries',
    'Recognize when to escalate to mental health professionals',
    'Understand the difference between peer support and therapy',
    'Apply scope knowledge in practical scenarios'
  ],
  sections: [
    {
      id: 'role-definition',
      title: language === 'es' ? 'Definiendo el Rol de Apoyo Entre Pares' : 'Defining the Peer Support Role',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>¿Qué ES el Apoyo Entre Pares?</h3>
          <p>El apoyo entre pares es un modelo de apoyo basado en la creencia de que las personas que han experimentado desafíos similares pueden ofrecer perspectivas únicas y valiosas para la recuperación.</p>
          
          <h4>Principios Fundamentales del Apoyo Entre Pares:</h4>
          <ul>
            <li><strong>Experiencia Vivida:</strong> Tu recuperación personal informa tu trabajo de apoyo</li>
            <li><strong>Esperanza:</strong> Modelar que la recuperación es posible</li>
            <li><strong>Mutualidad:</strong> Una relación basada en el respeto mutuo</li>
            <li><strong>Autodeterminación:</strong> Apoyar las decisiones y objetivos del usuario</li>
            <li><strong>Empoderamiento:</strong> Ayudar a los usuarios a desarrollar sus propias fortalezas</li>
          </ul>

          <h4>Lo Que HACES Como Especialista de Apoyo Entre Pares:</h4>
          <ul>
            <li>Proporcionar apoyo emocional y esperanza</li>
            <li>Compartir estrategias de afrontamiento basadas en tu experiencia</li>
            <li>Ayudar con la navegación de servicios y recursos</li>
            <li>Modelar habilidades de recuperación</li>
            <li>Acompañar en el viaje de recuperación</li>
            <li>Abogar por las necesidades y preferencias del usuario</li>
          </ul>

          <div class="highlight-box info">
            <h4>Recuerda</h4>
            <p>Tu valor único viene de tu experiencia vivida combinada con entrenamiento y habilidades especializadas.</p>
          </div>
        ` : `
          <h3>What IS Peer Support?</h3>
          <p>Peer support is a support model based on the belief that people who have experienced similar challenges can offer unique and valuable perspectives for recovery.</p>
          
          <h4>Core Principles of Peer Support:</h4>
          <ul>
            <li><strong>Lived Experience:</strong> Your personal recovery informs your support work</li>
            <li><strong>Hope:</strong> Modeling that recovery is possible</li>
            <li><strong>Mutuality:</strong> A relationship based on mutual respect</li>
            <li><strong>Self-Determination:</strong> Supporting user decisions and goals</li>
            <li><strong>Empowerment:</strong> Helping users develop their own strengths</li>
          </ul>

          <h4>What You DO As a Peer Support Specialist:</h4>
          <ul>
            <li>Provide emotional support and hope</li>
            <li>Share coping strategies based on your experience</li>
            <li>Help with service and resource navigation</li>
            <li>Model recovery skills</li>
            <li>Accompany on the recovery journey</li>
            <li>Advocate for user needs and preferences</li>
          </ul>

          <div class="highlight-box info">
            <h4>Remember</h4>
            <p>Your unique value comes from your lived experience combined with specialized training and skills.</p>
          </div>
        `,
        media: {
          type: 'image',
          url: '/lovable-uploads/peer-support-role.png',
          alt: 'Peer Support Role Definition'
        }
      }
    },
    {
      id: 'scope-boundaries',
      title: language === 'es' ? 'Límites del Alcance de Práctica' : 'Scope of Practice Boundaries',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Lo Que NO Haces Como Especialista de Apoyo Entre Pares</h3>
          <p>Comprender tus límites profesionales es tan importante como conocer tu rol. Estos límites te protegen a ti, a los usuarios y mantienen la integridad de la profesión.</p>
          
          <h4>NO Proporcionas:</h4>
          <ul>
            <li><strong>Diagnósticos:</strong> No puedes diagnosticar condiciones de salud mental</li>
            <li><strong>Terapia:</strong> No conduces sesiones de terapia o psicoterapia</li>
            <li><strong>Prescripciones:</strong> No puedes recetar o recomendar medicamentos</li>
            <li><strong>Evaluación Médica:</strong> No realizas evaluaciones médicas o psicológicas</li>
            <li><strong>Asesoramiento Financiero/Legal:</strong> No das consejos específicos en estas áreas</li>
          </ul>

          <h4>Diferencias Clave: Apoyo Entre Pares vs. Terapia</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Apoyo Entre Pares</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Terapia</th>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Basado en experiencia vivida</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Basado en entrenamiento clínico</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Relación mutua</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Relación profesional jerárquica</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Enfoque en fortalezas</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Enfoque en síntomas/patología</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Esperanza y empoderamiento</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Diagnóstico y tratamiento</td>
            </tr>
          </table>

          <div class="highlight-box warning">
            <h4>Límites Importantes</h4>
            <p>Nunca excedas tu alcance de práctica, incluso si sientes que puedes ayudar. Siempre deriva a profesionales apropiados cuando sea necesario.</p>
          </div>
        ` : `
          <h3>What You DON'T Do as a Peer Support Specialist</h3>
          <p>Understanding your professional boundaries is as important as knowing your role. These boundaries protect you, users, and maintain the integrity of the profession.</p>
          
          <h4>You DON'T Provide:</h4>
          <ul>
            <li><strong>Diagnoses:</strong> You cannot diagnose mental health conditions</li>
            <li><strong>Therapy:</strong> You don't conduct therapy or psychotherapy sessions</li>
            <li><strong>Prescriptions:</strong> You cannot prescribe or recommend medications</li>
            <li><strong>Medical Assessment:</strong> You don't perform medical or psychological evaluations</li>
            <li><strong>Financial/Legal Advice:</strong> You don't give specific advice in these areas</li>
          </ul>

          <h4>Key Differences: Peer Support vs. Therapy</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Peer Support</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Therapy</th>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Based on lived experience</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Based on clinical training</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Mutual relationship</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Hierarchical professional relationship</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Strengths-focused</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Symptom/pathology-focused</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Hope and empowerment</td>
              <td style="border: 1px solid #dee2e6; padding: 12px;">Diagnosis and treatment</td>
            </tr>
          </table>

          <div class="highlight-box warning">
            <h4>Important Boundaries</h4>
            <p>Never exceed your scope of practice, even if you feel you can help. Always refer to appropriate professionals when needed.</p>
          </div>
        `
      }
    },
    {
      id: 'scope-checklist',
      title: language === 'es' ? 'Lista de Verificación de Alcance: "¿Puedo...?"' : 'Scope Checklist: "Can I...?"',
      type: 'interactive',
      interactive: {
        type: 'checklist',
        data: {
          title: language === 'es' ? 'Marca SI o NO para cada escenario' : 'Check YES or NO for each scenario',
          scenarios: [
            {
              id: 'share-experience',
              question: language === 'es' 
                ? '¿Puedo compartir mi experiencia personal de recuperación?'
                : 'Can I share my personal recovery experience?',
              correctAnswer: 'yes',
              explanation: language === 'es'
                ? 'Sí, compartir tu experiencia vivida es central al apoyo entre pares.'
                : 'Yes, sharing your lived experience is central to peer support.'
            },
            {
              id: 'diagnose-depression',
              question: language === 'es'
                ? '¿Puedo decirle a un usuario que tiene depresión?'
                : 'Can I tell a user they have depression?',
              correctAnswer: 'no',
              explanation: language === 'es'
                ? 'No, los diagnósticos deben ser realizados por profesionales de salud mental calificados.'
                : 'No, diagnoses must be made by qualified mental health professionals.'
            },
            {
              id: 'help-navigate',
              question: language === 'es'
                ? '¿Puedo ayudar a alguien a navegar los servicios de salud mental?'
                : 'Can I help someone navigate mental health services?',
              correctAnswer: 'yes',
              explanation: language === 'es'
                ? 'Sí, la navegación de servicios es una función clave del apoyo entre pares.'
                : 'Yes, service navigation is a key function of peer support.'
            },
            {
              id: 'recommend-medication',
              question: language === 'es'
                ? '¿Puedo recomendar qué medicamentos debe tomar un usuario?'
                : 'Can I recommend what medications a user should take?',
              correctAnswer: 'no',
              explanation: language === 'es'
                ? 'No, las recomendaciones de medicamentos deben venir de profesionales médicos.'
                : 'No, medication recommendations must come from medical professionals.'
            },
            {
              id: 'provide-hope',
              question: language === 'es'
                ? '¿Puedo ofrecer esperanza y ánimo?'
                : 'Can I offer hope and encouragement?',
              correctAnswer: 'yes',
              explanation: language === 'es'
                ? 'Sí, proporcionar esperanza es un aspecto fundamental del apoyo entre pares.'
                : 'Yes, providing hope is a fundamental aspect of peer support.'
            },
            {
              id: 'conduct-therapy',
              question: language === 'es'
                ? '¿Puedo conducir una sesión de terapia?'
                : 'Can I conduct a therapy session?',
              correctAnswer: 'no',
              explanation: language === 'es'
                ? 'No, la terapia debe ser proporcionada por terapeutas licenciados.'
                : 'No, therapy must be provided by licensed therapists.'
            }
          ]
        }
      }
    },
    {
      id: 'escalation-roleplay',
      title: language === 'es' ? 'Role-Play de Escalamiento' : 'Escalation Role-Play',
      type: 'simulation',
      interactive: {
        type: 'scenario',
        data: {
          scenario: language === 'es' ? 'Escenario de Escalamiento - Excediendo el Alcance' : 'Escalation Scenario - Exceeding Scope',
          description: language === 'es' 
            ? 'Un usuario está pidiendo tu opinión sobre si debe dejar su medicación porque siente que no funciona.'
            : 'A user is asking for your opinion on whether they should stop their medication because they feel it\'s not working.',
          chatMessages: [
            {
              from: 'user',
              message: language === 'es' 
                ? 'He estado tomando estos antidepresivos durante dos meses y no siento diferencia. ¿Crees que debería dejarlos? Tú entiendes estos temas.'
                : 'I\'ve been taking these antidepressants for two months and don\'t feel different. Do you think I should stop them? You understand these things.',
              timestamp: Date.now() - 120000
            }
          ],
          responseOptions: [
            {
              id: 'appropriate-boundary',
              text: language === 'es' 
                ? 'Entiendo tu frustración. Las decisiones sobre medicamentos están fuera de mi alcance como especialista de apoyo. Hablemos sobre cómo puedes discutir esto con tu médico.'
                : 'I understand your frustration. Medication decisions are outside my scope as a peer specialist. Let\'s talk about how you can discuss this with your doctor.',
              correct: true,
              feedback: language === 'es'
                ? 'Correcto. Esta respuesta mantiene límites apropiados mientras ofrece apoyo.'
                : 'Correct. This response maintains appropriate boundaries while offering support.'
            },
            {
              id: 'give-advice',
              text: language === 'es'
                ? 'Basado en mi experiencia, probablemente deberías darle más tiempo. Yo tuve que cambiar medicamentos varias veces.'
                : 'Based on my experience, you should probably give it more time. I had to switch medications several times.',
              correct: false,
              feedback: language === 'es'
                ? 'Incorrecto. Esto proporciona consejo médico fuera de tu alcance.'
                : 'Incorrect. This provides medical advice outside your scope.'
            },
            {
              id: 'share-experience',
              text: language === 'es'
                ? 'Puedo compartir que en mi experiencia, trabajar con mi médico para ajustar medicamentos fue importante. ¿Te gustaría hablar sobre cómo prepararte para esa conversación?'
                : 'I can share that in my experience, working with my doctor to adjust medications was important. Would you like to talk about how to prepare for that conversation?',
              correct: true,
              feedback: language === 'es'
                ? 'Correcto. Esto comparte experiencia vivida mientras mantiene límites apropiados.'
                : 'Correct. This shares lived experience while maintaining appropriate boundaries.'
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
        ? '¿Cuál es una función APROPIADA del apoyo entre pares?'
        : 'Which is an APPROPRIATE function of peer support?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' 
            ? 'Diagnosticar condiciones de salud mental'
            : 'Diagnosing mental health conditions',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es'
            ? 'Compartir estrategias de afrontamiento basadas en experiencia personal'
            : 'Sharing coping strategies based on personal experience',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es'
            ? 'Prescribir medicamentos'
            : 'Prescribing medications',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Los especialistas de apoyo entre pares comparten su experiencia vivida para ayudar a otros en recuperación.'
        : 'Peer support specialists share their lived experience to help others in recovery.'
    },
    {
      id: 'q2',
      question: language === 'es'
        ? '¿Cuándo debes escalar a un profesional de salud mental?'
        : 'When should you escalate to a mental health professional?',
      type: 'multiple-select',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Usuario solicita diagnóstico' : 'User requests diagnosis',
          correct: true
        },
        {
          id: 'b', 
          text: language === 'es' ? 'Usuario necesita apoio emocional' : 'User needs emotional support',
          correct: false
        },
        {
          id: 'c',
          text: language === 'es' ? 'Usuario presenta síntomas psicóticos' : 'User presents psychotic symptoms',
          correct: true
        },
        {
          id: 'd',
          text: language === 'es' ? 'Usuario hace preguntas sobre medicación' : 'User asks questions about medication',
          correct: true
        }
      ],
      explanation: language === 'es'
        ? 'Escala cuando los problemas están fuera de tu alcance de práctica como especialista de apoyo entre pares.'
        : 'Escalate when issues are outside your scope of practice as a peer support specialist.'
    },
    {
      id: 'q3',
      question: language === 'es'
        ? '¿Cuál es la diferencia principal entre apoyo entre pares y terapia?'
        : 'What is the main difference between peer support and therapy?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'El apoyo entre pares es menos efectivo' : 'Peer support is less effective',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es' ? 'El apoyo entre pares se basa en experiencia vivida compartida' : 'Peer support is based on shared lived experience',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'El apoyo entre pares es más costoso' : 'Peer support is more expensive',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'El apoyo entre pares se basa únicamente en la experiencia vivida compartida y la mutualidad.'
        : 'Peer support is uniquely based on shared lived experience and mutuality.'
    }
  ],
  reflection: {
    question: language === 'es'
      ? 'Reflexiona sobre momentos en tu propia recuperación cuando recibiste diferentes tipos de apoyo. ¿Cómo fue diferente el apoyo entre pares de la terapia profesional? ¿Qué hizo que cada uno fuera valioso a su manera?'
      : 'Reflect on times in your own recovery when you received different types of support. How was peer support different from professional therapy? What made each valuable in its own way?',
    placeholder: language === 'es'
      ? 'Comparte tus pensamientos sobre el valor único del apoyo entre pares y cómo planeas mantener límites apropiados...'
      : 'Share your thoughts about the unique value of peer support and how you plan to maintain appropriate boundaries...',
    category: 'role-scope'
  }
});