import React from 'react';
import { Users, Map, Link, Heart, Compass } from 'lucide-react';
import { TrainingModule } from '../InteractiveTrainingModule';

export const createSelfHelpMutualSupportModule = (language: string = 'en'): TrainingModule => ({
  id: 'self-help-mutual-support',
  title: language === 'es' ? 'Autoayuda y Apoyo Mutuo' : 'Self-Help & Mutual Support',
  description: language === 'es' 
    ? 'Aprende sobre grupos de autoayuda, redes de apoyo mutuo y cómo conectar usuarios con recursos comunitarios.'
    : 'Learn about self-help groups, mutual support networks, and how to connect users with community resources.',
  icon: Users,
  duration: language === 'es' ? '20-25 minutos' : '20-25 minutes',
  objectives: language === 'es' ? [
    'Comprender diferentes tipos de grupos de autoayuda',
    'Navegar recursos de apoyo mutuo disponibles',
    'Conectar usuarios con grupos apropiados',
    'Facilitar conexiones entre pares',
    'Apoyar el desarrollo de redes sociales saludables'
  ] : [
    'Understand different types of self-help groups',
    'Navigate available mutual support resources',
    'Connect users with appropriate groups',
    'Facilitate peer connections',
    'Support development of healthy social networks'
  ],
  sections: [
    {
      id: 'understanding-self-help',
      title: language === 'es' ? 'Comprendiendo la Autoayuda y el Apoyo Mutuo' : 'Understanding Self-Help & Mutual Support',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>¿Qué Son los Grupos de Autoayuda?</h3>
          <p>Los grupos de autoayuda son reuniones voluntarias de personas que comparten un problema o experiencia común. Estos grupos operan bajo el principio de que las personas que han experimentado desafíos similares pueden proporcionarse apoyo mutuo valioso.</p>
          
          <h4>Características Clave de los Grupos de Autoayuda:</h4>
          <ul>
            <li><strong>Liderazgo de Pares:</strong> Dirigidos por miembros, no por profesionales</li>
            <li><strong>Experiencia Compartida:</strong> Todos los miembros han enfrentado desafíos similares</li>
            <li><strong>Apoyo Mutuo:</strong> Los miembros se ayudan unos a otros</li>
            <li><strong>Voluntario:</strong> La participación es voluntaria y gratuita</li>
            <li><strong>Confidencialidad:</strong> Lo que se comparte en el grupo permanece en el grupo</li>
          </ul>

          <h4>Tipos de Grupos de Autoayuda:</h4>
          
          <h5>Programas de 12 Pasos:</h5>
          <ul>
            <li>Alcohólicos Anónimos (AA)</li>
            <li>Narcóticos Anónimos (NA)</li>
            <li>Jugadores Anónimos (GA)</li>
            <li>Comedores Compulsivos Anónimos (OA)</li>
            <li>Al-Anon (para familias de alcohólicos)</li>
          </ul>

          <h5>Grupos de Apoyo para Condiciones Específicas:</h5>
          <ul>
            <li>NAMI (Alianza Nacional sobre Enfermedades Mentales)</li>
            <li>Grupos de apoyo para depresión y ansiedad</li>
            <li>Grupos de apoyo para duelo y pérdida</li>
            <li>Grupos de apoyo para trauma/PTSD</li>
            <li>Grupos de apoyo para trastornos alimentarios</li>
          </ul>

          <h5>Grupos de Apoyo En Línea:</h5>
          <ul>
            <li>Foros de recuperación</li>
            <li>Grupos de redes sociales</li>
            <li>Reuniones virtuales</li>
            <li>Aplicaciones de apoyo entre pares</li>
          </ul>
        ` : `
          <h3>What Are Self-Help Groups?</h3>
          <p>Self-help groups are voluntary gatherings of people who share a common problem or experience. These groups operate on the principle that people who have experienced similar challenges can provide valuable mutual support to each other.</p>
          
          <h4>Key Characteristics of Self-Help Groups:</h4>
          <ul>
            <li><strong>Peer Leadership:</strong> Led by members, not professionals</li>
            <li><strong>Shared Experience:</strong> All members have faced similar challenges</li>
            <li><strong>Mutual Support:</strong> Members help each other</li>
            <li><strong>Voluntary:</strong> Participation is voluntary and free</li>
            <li><strong>Confidentiality:</strong> What is shared in group stays in group</li>
          </ul>

          <h4>Types of Self-Help Groups:</h4>
          
          <h5>12-Step Programs:</h5>
          <ul>
            <li>Alcoholics Anonymous (AA)</li>
            <li>Narcotics Anonymous (NA)</li>
            <li>Gamblers Anonymous (GA)</li>
            <li>Overeaters Anonymous (OA)</li>
            <li>Al-Anon (for families of alcoholics)</li>
          </ul>

          <h5>Condition-Specific Support Groups:</h5>
          <ul>
            <li>NAMI (National Alliance on Mental Illness)</li>
            <li>Depression and Anxiety support groups</li>
            <li>Grief and Loss support groups</li>
            <li>Trauma/PTSD support groups</li>
            <li>Eating Disorder support groups</li>
          </ul>

          <h5>Online Support Groups:</h5>
          <ul>
            <li>Recovery forums</li>
            <li>Social media groups</li>
            <li>Virtual meetings</li>
            <li>Peer support apps</li>
          </ul>
        `,
        media: {
          type: 'image',
          url: '/lovable-uploads/support-groups.png',
          alt: 'Types of Support Groups'
        }
      }
    },
    {
      id: 'resource-navigator',
      title: language === 'es' ? 'Navegador de Recursos de Apoyo' : 'Support Resource Navigator',
      type: 'interactive',
      interactive: {
        type: 'drag-drop',
        data: {
          title: language === 'es' ? 'Mapa Interactivo de Recursos de Apoyo Mutuo' : 'Interactive Mutual Support Resource Map',
          instruction: language === 'es' 
            ? 'Conecta a cada usuario con el tipo de grupo de apoyo más apropiado para sus necesidades'
            : 'Connect each user with the most appropriate type of support group for their needs',
          users: [
            {
              id: 'user1',
              description: language === 'es' 
                ? 'Persona con 6 meses sobria del alcohol, busca apoyo continuo'
                : 'Person with 6 months sober from alcohol, seeking ongoing support',
              correctMatch: 'aa-group'
            },
            {
              id: 'user2',
              description: language === 'es'
                ? 'Madre cuyo hijo adulto lucha con la adicción'
                : 'Mother whose adult child struggles with addiction',
              correctMatch: 'family-support'
            },
            {
              id: 'user3',
              description: language === 'es'
                ? 'Persona con ansiedad social, incómoda con reuniones en persona'
                : 'Person with social anxiety, uncomfortable with in-person meetings',
              correctMatch: 'online-support'
            },
            {
              id: 'user4',
              description: language === 'es'
                ? 'Veterano con PTSD que busca otros que entiendan el trauma militar'
                : 'Veteran with PTSD seeking others who understand military trauma',
              correctMatch: 'trauma-support'
            },
            {
              id: 'user5',
              description: language === 'es'
                ? 'Persona que ha perdido a su cónyuge recientemente'
                : 'Person who recently lost their spouse',
              correctMatch: 'grief-support'
            }
          ],
          supportGroups: [
            {
              id: 'aa-group',
              name: language === 'es' ? 'Grupo AA Local' : 'Local AA Group',
              description: language === 'es' ? 'Reuniones presenciales regulares' : 'Regular in-person meetings'
            },
            {
              id: 'family-support',
              name: language === 'es' ? 'Al-Anon/Nar-Anon' : 'Al-Anon/Nar-Anon',
              description: language === 'es' ? 'Para familias afectadas por la adicción' : 'For families affected by addiction'
            },
            {
              id: 'online-support',
              name: language === 'es' ? 'Grupos de Apoyo En Línea' : 'Online Support Groups',
              description: language === 'es' ? 'Reuniones virtuales y foros' : 'Virtual meetings and forums'
            },
            {
              id: 'trauma-support',
              name: language === 'es' ? 'Grupo de Apoyo para Veteranos' : 'Veterans Support Group',
              description: language === 'es' ? 'Específico para trauma militar' : 'Specific to military trauma'
            },
            {
              id: 'grief-support',
              name: language === 'es' ? 'Grupo de Apoyo para el Duelo' : 'Grief Support Group',
              description: language === 'es' ? 'Para aquellos que enfrentan pérdidas' : 'For those facing loss'
            }
          ]
        }
      }
    },
    {
      id: 'facilitating-connections',
      title: language === 'es' ? 'Facilitando Conexiones Entre Pares' : 'Facilitating Peer Connections',
      type: 'content',
      content: {
        text: language === 'es' ? `
          <h3>Tu Rol en Conectar a las Personas</h3>
          <p>Como especialista de apoyo entre pares, juegas un papel crucial en ayudar a las personas a encontrar y conectarse con redes de apoyo mutuo apropiadas.</p>
          
          <h4>Estrategias para Facilitar Conexiones:</h4>
          
          <h5>1. Evaluación de Necesidades</h5>
          <ul>
            <li>Evalúa las necesidades específicas y preferencias del usuario</li>
            <li>Considera factores como ubicación, horario y comodidad</li>
            <li>Explora experiencias pasadas con grupos de apoyo</li>
            <li>Identifica cualquier barrera para la participación</li>
          </ul>

          <h5>2. Educación Sobre Opciones</h5>
          <ul>
            <li>Explica diferentes tipos de grupos de apoyo disponibles</li>
            <li>Describe qué esperar en diferentes tipos de reuniones</li>
            <li>Comparte información sobre la cultura y estructura del grupo</li>
            <li>Discute las ventajas de diferentes formatos (presencial vs. en línea)</li>
          </ul>

          <h5>3. Preparación para la Participación</h5>
          <ul>
            <li>Ayuda a reducir la ansiedad sobre asistir a la primera reunión</li>
            <li>Prepara para que sepan qué decir si se les pregunta para compartir</li>
            <li>Explica que pueden simplemente escuchar al principio</li>
            <li>Ofrece acompañarlos si es apropiado y está disponible</li>
          </ul>

          <h5>4. Seguimiento y Apoyo</h5>
          <ul>
            <li>Haz seguimiento después de la primera reunión</li>
            <li>Procesa su experiencia y cualquier inquietud</li>
            <li>Ayuda a encontrar un grupo diferente si el primero no fue adecuado</li>
            <li>Celebra su coraje para dar el paso</li>
          </ul>

          <h4>Superando Barreras Comunes:</h4>
          <ul>
            <li><strong>Estigma:</strong> Normaliza la búsqueda de apoyo</li>
            <li><strong>Ansiedad:</strong> Ofrece estrategias de afrontamiento</li>
            <li><strong>Tiempo:</strong> Ayuda a priorizar el autocuidado</li>
            <li><strong>Transporte:</strong> Explora opciones en línea o ayuda con logística</li>
            <li><strong>Experiencias Pasadas Negativas:</strong> Discute que no todos los grupos son iguales</li>
          </ul>
        ` : `
          <h3>Your Role in Connecting People</h3>
          <p>As a peer support specialist, you play a crucial role in helping people find and connect with appropriate mutual support networks.</p>
          
          <h4>Strategies for Facilitating Connections:</h4>
          
          <h5>1. Needs Assessment</h5>
          <ul>
            <li>Assess the user's specific needs and preferences</li>
            <li>Consider factors like location, timing, and comfort level</li>
            <li>Explore past experiences with support groups</li>
            <li>Identify any barriers to participation</li>
          </ul>

          <h5>2. Education About Options</h5>
          <ul>
            <li>Explain different types of support groups available</li>
            <li>Describe what to expect in different types of meetings</li>
            <li>Share information about group culture and structure</li>
            <li>Discuss advantages of different formats (in-person vs. online)</li>
          </ul>

          <h5>3. Preparation for Participation</h5>
          <ul>
            <li>Help reduce anxiety about attending first meeting</li>
            <li>Prepare them for what to say if asked to share</li>
            <li>Explain they can just listen at first</li>
            <li>Offer to accompany them if appropriate and available</li>
          </ul>

          <h5>4. Follow-up and Support</h5>
          <ul>
            <li>Check in after first meeting</li>
            <li>Process their experience and any concerns</li>
            <li>Help find different group if first wasn't a good fit</li>
            <li>Celebrate their courage in taking the step</li>
          </ul>

          <h4>Overcoming Common Barriers:</h4>
          <ul>
            <li><strong>Stigma:</strong> Normalize seeking support</li>
            <li><strong>Anxiety:</strong> Offer coping strategies</li>
            <li><strong>Time:</strong> Help prioritize self-care</li>
            <li><strong>Transportation:</strong> Explore online options or help with logistics</li>
            <li><strong>Past Negative Experiences:</strong> Discuss that not all groups are the same</li>
          </ul>
        `
      }
    },
    {
      id: 'peer-link-simulation',
      title: language === 'es' ? 'Simulación de Conexión Entre Pares' : 'Peer Connection Simulation',
      type: 'simulation',
      interactive: {
        type: 'scenario',
        data: {
          scenario: language === 'es' ? 'Conectando a un Usuario con Apoyo Grupal' : 'Connecting a User with Group Support',
          description: language === 'es' 
            ? 'Un usuario expresa interés en encontrar apoyo, pero tiene dudas sobre unirse a un grupo.'
            : 'A user expresses interest in finding support but has reservations about joining a group.',
          chatMessages: [
            {
              from: 'user',
              message: language === 'es' 
                ? 'He estado pensando en lo que dijiste sobre los grupos de apoyo. Creo que podría necesitar algo así, pero estoy nervioso. ¿Y si no encajo? ¿Y si es raro?'
                : 'I\'ve been thinking about what you said about support groups. I think I might need something like that, but I\'m nervous. What if I don\'t fit in? What if it\'s weird?',
              timestamp: Date.now() - 180000
            }
          ],
          responseOptions: [
            {
              id: 'validate-normalize',
              text: language === 'es' 
                ? 'Es completamente normal sentirse nervioso sobre unirse a un grupo nuevo. Muchas personas se sienten así al principio. ¿Qué tipo de apoyo sientes que sería más útil para ti?'
                : 'It\'s completely normal to feel nervous about joining a new group. Many people feel that way at first. What kind of support do you feel would be most helpful for you?',
              correct: true,
              outcome: language === 'es' ? 'Valida sentimientos y explora necesidades' : 'Validates feelings and explores needs'
            },
            {
              id: 'minimize-concerns',
              text: language === 'es'
                ? 'No te preocupes por eso. Solo ve y verás que está bien.'
                : 'Don\'t worry about that. Just go and you\'ll see it\'s fine.',
              correct: false,
              outcome: language === 'es' ? 'Minimiza preocupaciones válidas' : 'Minimizes valid concerns'
            },
            {
              id: 'share-experience',
              text: language === 'es'
                ? 'Puedo relacionarme con esos sentimientos. Cuando fui a mi primer grupo, también estaba nervioso. ¿Te gustaría que hablemos sobre diferentes opciones y qué podrías esperar?'
                : 'I can relate to those feelings. When I went to my first group, I was nervous too. Would you like us to talk about different options and what you might expect?',
              correct: true,
              outcome: language === 'es' ? 'Comparte experiencia y ofrece exploración' : 'Shares experience and offers exploration'
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
        ? '¿Cuál es una característica clave de los grupos de autoayuda efectivos?'
        : 'What is a key characteristic of effective self-help groups?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' 
            ? 'Dirigidos por profesionales de salud mental'
            : 'Led by mental health professionals',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es'
            ? 'Basados en experiencia vivida compartida'
            : 'Based on shared lived experience',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es'
            ? 'Requieren certificación médica'
            : 'Require medical certification',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'Los grupos de autoayuda efectivos están dirigidos por pares que comparten experiencias similares.'
        : 'Effective self-help groups are led by peers who share similar experiences.'
    },
    {
      id: 'q2',
      question: language === 'es'
        ? '¿Cuándo es apropiado acompañar a un usuario a su primera reunión de grupo?'
        : 'When is it appropriate to accompany a user to their first group meeting?',
      type: 'multiple-select',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Cuando lo soliciten y sea apropiado' : 'When they request it and it\'s appropriate',
          correct: true
        },
        {
          id: 'b', 
          text: language === 'es' ? 'Solo si el grupo lo permite' : 'Only if the group allows it',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'Cada vez para asegurar su participación' : 'Every time to ensure their participation',
          correct: false
        },
        {
          id: 'd',
          text: language === 'es' ? 'Cuando la ansiedad les impediría ir solos' : 'When anxiety would prevent them from going alone',
          correct: true
        }
      ],
      explanation: language === 'es'
        ? 'Acompañar puede ser apropiado cuando se solicita, está permitido, y apoya la independencia.'
        : 'Accompanying can be appropriate when requested, allowed, and supports independence.'
    },
    {
      id: 'q3',
      question: language === 'es'
        ? '¿Cuál NO es un tipo común de grupo de apoyo mutuo?'
        : 'Which is NOT a common type of mutual support group?',
      type: 'multiple-choice',
      options: [
        {
          id: 'a',
          text: language === 'es' ? 'Programas de 12 pasos' : '12-step programs',
          correct: false
        },
        {
          id: 'b',
          text: language === 'es' ? 'Terapia de grupo dirigida por un médico' : 'Doctor-led group therapy',
          correct: true
        },
        {
          id: 'c',
          text: language === 'es' ? 'Grupos de apoyo en línea' : 'Online support groups',
          correct: false
        }
      ],
      explanation: language === 'es'
        ? 'La terapia de grupo dirigida por un médico es tratamiento profesional, no apoyo mutuo.'
        : 'Doctor-led group therapy is professional treatment, not mutual support.'
    }
  ],
  reflection: {
    question: language === 'es'
      ? 'Reflexiona sobre las redes de apoyo que han sido importantes en tu propia recuperación. ¿Qué grupos o comunidades te han ayudado más? ¿Cómo puedes usar esta experiencia para ayudar a otros a encontrar su propio apoyo comunitario?'
      : 'Reflect on the support networks that have been important in your own recovery. What groups or communities have helped you most? How can you use this experience to help others find their own community support?',
    placeholder: language === 'es'
      ? 'Comparte tus pensamientos sobre la importancia de la comunidad y el apoyo mutuo en la recuperación...'
      : 'Share your thoughts about the importance of community and mutual support in recovery...',
    category: 'mutual-support'
  }
});