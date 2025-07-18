
export const PERFORMANCE_GOALS = {
  CHAT_COMPLETION_RATE: 75,
  CHECKIN_COMPLETION_RATE: 75,
  AVG_USER_RATING: 4.5,
  AVG_RESPONSE_TIME_SECONDS: 45,
  AVG_STREAK_IMPACT: 1,
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
