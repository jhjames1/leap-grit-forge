import { PERFORMANCE_GOALS, METRIC_DESCRIPTIONS, COACHING_TIPS } from './performanceGoals';

interface SpecialistPerformance {
  id: string;
  name: string;
  email: string;
  status: string;
  active_sessions: number;
  completed_sessions: number;
  total_sessions: number;
  avg_rating: number;
  avg_response_time_seconds: number;
  workload_score: number;
  performance_score: number;
  last_active: string;
}

interface CoachingTip {
  title: string;
  description: string;
  actionSteps?: string[];
}

interface CoachingCategory {
  category: string;
  priority: 'high' | 'medium' | 'low';
  tips: CoachingTip[];
}

interface PerformanceAssessment {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  goals: {
    metric: string;
    current: string;
    target: string;
    description: string;
  }[];
}

export const getPerformanceAssessment = (specialist: SpecialistPerformance): PerformanceAssessment => {
  const completionRate = specialist.total_sessions > 0 
    ? (specialist.completed_sessions / specialist.total_sessions) * 100 
    : 0;
  
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const goals = [];

  // Analyze completion rate
  if (completionRate >= PERFORMANCE_GOALS.CHAT_COMPLETION_RATE) {
    strengths.push('Excellent session completion rate');
  } else {
    areasForImprovement.push('Session completion rate needs improvement');
    goals.push({
      metric: 'Session Completion Rate',
      current: `${Math.round(completionRate)}%`,
      target: `≥${PERFORMANCE_GOALS.CHAT_COMPLETION_RATE}%`,
      description: 'Improve engagement and session structure'
    });
  }

  // Analyze user rating
  if (specialist.avg_rating >= PERFORMANCE_GOALS.AVG_USER_RATING) {
    strengths.push('Outstanding user satisfaction ratings');
  } else {
    areasForImprovement.push('User satisfaction could be enhanced');
    goals.push({
      metric: 'Average User Rating',
      current: `${specialist.avg_rating.toFixed(1)}★`,
      target: `≥${PERFORMANCE_GOALS.AVG_USER_RATING}★`,
      description: 'Focus on empathy and active listening skills'
    });
  }

  // Analyze response time
  if (specialist.avg_response_time_seconds <= PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS) {
    strengths.push('Excellent response time');
  } else {
    areasForImprovement.push('Response time optimization needed');
    goals.push({
      metric: 'Average Response Time',
      current: `${specialist.avg_response_time_seconds}s`,
      target: `≤${PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS}s`,
      description: 'Improve efficiency and preparation strategies'
    });
  }

  // Analyze workload
  if (specialist.workload_score > 90) {
    areasForImprovement.push('High workload may impact performance');
    goals.push({
      metric: 'Workload Management',
      current: `${specialist.workload_score}%`,
      target: '≤85%',
      description: 'Balance session load for optimal performance'
    });
  } else if (specialist.workload_score >= 70) {
    strengths.push('Well-balanced workload management');
  }

  const summary = areasForImprovement.length === 0 
    ? 'Excellent performance across all key metrics. Focus on maintaining current standards and potential mentoring opportunities.'
    : `${strengths.length} strengths identified with ${areasForImprovement.length} areas for targeted improvement.`;

  return {
    summary,
    strengths,
    areasForImprovement,
    goals
  };
};

export const getAdvancedCoachingTips = (specialist: SpecialistPerformance): CoachingCategory[] => {
  const categories: CoachingCategory[] = [];
  const completionRate = specialist.total_sessions > 0 
    ? (specialist.completed_sessions / specialist.total_sessions) * 100 
    : 0;

  // Response Time Coaching
  if (specialist.avg_response_time_seconds > PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS) {
    const priority = specialist.avg_response_time_seconds > 90 ? 'high' : 'medium';
    categories.push({
      category: 'Response Time Optimization',
      priority,
      tips: [
        {
          title: 'Prepare Standard Responses',
          description: 'Create templates for common situations to respond faster while maintaining personalization.',
          actionSteps: [
            'Develop 5-10 template responses for frequent scenarios',
            'Practice personalizing templates quickly',
            'Use keyboard shortcuts for common phrases'
          ]
        },
        {
          title: 'Active Listening Techniques',
          description: 'Improve your ability to quickly understand and respond to user needs.',
          actionSteps: [
            'Practice summarizing user concerns in 1-2 sentences',
            'Ask clarifying questions early in conversations',
            'Use reflective listening to confirm understanding'
          ]
        }
      ]
    });
  }

  // User Satisfaction Coaching
  if (specialist.avg_rating < PERFORMANCE_GOALS.AVG_USER_RATING) {
    const priority = specialist.avg_rating < 3.5 ? 'high' : 'medium';
    categories.push({
      category: 'User Engagement & Satisfaction',
      priority,
      tips: [
        {
          title: 'Empathetic Communication',
          description: 'Strengthen emotional connection and understanding with users.',
          actionSteps: [
            'Acknowledge emotions before providing solutions',
            'Use validation phrases like "I understand how difficult this must be"',
            'Share appropriate personal insights when relevant'
          ]
        },
        {
          title: 'Session Structure Improvement',
          description: 'Create more engaging and effective session flows.',
          actionSteps: [
            'Start sessions with clear goal-setting',
            'Provide regular check-ins during conversations',
            'End with actionable next steps and encouragement'
          ]
        }
      ]
    });
  }

  // Session Completion Coaching
  if (completionRate < PERFORMANCE_GOALS.CHAT_COMPLETION_RATE) {
    const priority = completionRate < 50 ? 'high' : 'medium';
    categories.push({
      category: 'Session Completion Strategy',
      priority,
      tips: [
        {
          title: 'Engagement Techniques',
          description: 'Keep users engaged throughout the entire session.',
          actionSteps: [
            'Ask open-ended questions to encourage participation',
            'Share relevant resources and tools during sessions',
            'Create collaborative action plans with users'
          ]
        },
        {
          title: 'Crisis Prevention',
          description: 'Identify and address potential session abandonment early.',
          actionSteps: [
            'Monitor user engagement levels throughout sessions',
            'Address concerns or resistance immediately',
            'Provide options when users seem overwhelmed'
          ]
        }
      ]
    });
  }

  // Workload Management Coaching
  if (specialist.workload_score > 85) {
    categories.push({
      category: 'Workload & Self-Care',
      priority: specialist.workload_score > 95 ? 'high' : 'medium',
      tips: [
        {
          title: 'Sustainable Scheduling',
          description: 'Optimize your availability to maintain quality while preventing burnout.',
          actionSteps: [
            'Schedule regular breaks between intense sessions',
            'Block time for administrative tasks and preparation',
            'Set boundaries on daily session limits'
          ]
        },
        {
          title: 'Energy Management',
          description: 'Maintain consistent performance throughout your shifts.',
          actionSteps: [
            'Practice stress-reduction techniques between sessions',
            'Stay hydrated and take movement breaks',
            'Debrief challenging sessions with supervisors'
          ]
        }
      ]
    });
  }

  // Performance Excellence (for high performers)
  if (specialist.avg_rating >= PERFORMANCE_GOALS.AVG_USER_RATING && 
      completionRate >= PERFORMANCE_GOALS.CHAT_COMPLETION_RATE &&
      specialist.avg_response_time_seconds <= PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS) {
    categories.push({
      category: 'Leadership & Mentoring',
      priority: 'low',
      tips: [
        {
          title: 'Peer Mentoring Opportunities',
          description: 'Share your expertise to help develop other specialists.',
          actionSteps: [
            'Volunteer to mentor new specialists',
            'Document best practices and successful techniques',
            'Lead training sessions on your areas of strength'
          ]
        },
        {
          title: 'Advanced Skill Development',
          description: 'Continue growing your capabilities and impact.',
          actionSteps: [
            'Pursue additional certifications in specialized areas',
            'Experiment with new therapeutic techniques',
            'Collect user feedback for continuous improvement'
          ]
        }
      ]
    });
  }

  return categories;
};

export const getCoachingPriority = (specialist: SpecialistPerformance): 'high' | 'medium' | 'low' => {
  const completionRate = specialist.total_sessions > 0 
    ? (specialist.completed_sessions / specialist.total_sessions) * 100 
    : 0;

  // High priority: Multiple critical metrics below goals
  const criticalIssues = [
    specialist.avg_rating < 3.5,
    completionRate < 50,
    specialist.avg_response_time_seconds > 90,
    specialist.workload_score > 95
  ].filter(Boolean).length;

  if (criticalIssues >= 2) return 'high';

  // Medium priority: One metric significantly below goal or workload concerns
  const moderateIssues = [
    specialist.avg_rating < PERFORMANCE_GOALS.AVG_USER_RATING,
    completionRate < PERFORMANCE_GOALS.CHAT_COMPLETION_RATE,
    specialist.avg_response_time_seconds > PERFORMANCE_GOALS.AVG_RESPONSE_TIME_SECONDS,
    specialist.workload_score > 85
  ].filter(Boolean).length;

  if (moderateIssues >= 1) return 'medium';

  return 'low';
};