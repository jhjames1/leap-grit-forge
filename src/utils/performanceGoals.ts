
export const PERFORMANCE_GOALS = {
  CHAT_COMPLETION_RATE: 75,
  CHECKIN_COMPLETION_RATE: 75,
  AVG_USER_RATING: 4.5,
  AVG_RESPONSE_TIME_SECONDS: 45,
  AVG_STREAK_IMPACT: 1,
} as const;

export const METRIC_DESCRIPTIONS = {
  CHAT_COMPLETION_RATE: 'Percentage of chat sessions completed successfully',
  CHECKIN_COMPLETION_RATE: 'Percentage of scheduled check-ins completed by users',
  AVG_USER_RATING: 'Average satisfaction rating from completed sessions',
  AVG_RESPONSE_TIME_SECONDS: 'Average time to respond to user messages',
  AVG_STREAK_IMPACT: 'Average change in user recovery streaks after sessions',
} as const;

export const COACHING_TIPS = {
  CHAT_COMPLETION_RATE: 'Improve chat completion rates by setting clear session goals at the start',
  CHECKIN_COMPLETION_RATE: 'Set regular reminders for user check-ins to improve completion rates',
  AVG_USER_RATING: 'Focus on active listening and empathy to improve user satisfaction',
  AVG_RESPONSE_TIME_SECONDS: 'Aim for quicker response times to maintain user engagement',
  AVG_STREAK_IMPACT: 'Focus on providing more impactful support to help users maintain their recovery streaks',
} as const;

export const getGoalText = (metricKey: keyof typeof PERFORMANCE_GOALS): string => {
  switch (metricKey) {
    case 'CHAT_COMPLETION_RATE':
      return '≥75%';
    case 'CHECKIN_COMPLETION_RATE':
      return '≥75%';
    case 'AVG_USER_RATING':
      return '≥4.5★';
    case 'AVG_RESPONSE_TIME_SECONDS':
      return '≤45s';
    case 'AVG_STREAK_IMPACT':
      return '≥+1d';
    default:
      return '';
  }
};

export const getMetricDescription = (metricKey: keyof typeof PERFORMANCE_GOALS): string => {
  return METRIC_DESCRIPTIONS[metricKey];
};

export const getCoachingTip = (metricKey: keyof typeof PERFORMANCE_GOALS): string => {
  return COACHING_TIPS[metricKey];
};

export const isMetricBelowGoal = (
  value: number | undefined, 
  metricKey: keyof typeof PERFORMANCE_GOALS
): boolean => {
  if (value === undefined || value === null) return true;
  
  const goal = PERFORMANCE_GOALS[metricKey];
  
  // Response time is reversed (lower is better)
  if (metricKey === 'AVG_RESPONSE_TIME_SECONDS') {
    return value > goal;
  }
  
  return value < goal;
};
