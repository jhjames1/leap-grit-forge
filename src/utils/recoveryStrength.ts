
// Recovery Strength tracking based on BARC-10 domains
// Users never see "BARC-10" terminology

export interface RecoveryStrengthData {
  overall: number; // 0-100%
  domains: {
    confidence: number;
    satisfaction: number;
    craving: number;
    peerSupport: number;
    mood: number;
    meaning: number;
    selfCare: number;
    goals: number;
    social: number;
    structure: number;
  };
  lastUpdated: Date;
  recentChanges: Array<{
    action: string;
    change: number;
    timestamp: Date;
  }>;
}

export const getInitialRecoveryStrength = (): RecoveryStrengthData => ({
  overall: 45, // Starting baseline
  domains: {
    confidence: 40,
    satisfaction: 45,
    craving: 50,
    peerSupport: 40,
    mood: 45,
    meaning: 40,
    selfCare: 45,
    goals: 40,
    social: 40,
    structure: 45,
  },
  lastUpdated: new Date(),
  recentChanges: []
});

export const updateRecoveryStrength = (
  currentData: RecoveryStrengthData,
  action: string,
  domain: keyof RecoveryStrengthData['domains'],
  change: number
): RecoveryStrengthData => {
  const newDomains = {
    ...currentData.domains,
    [domain]: Math.max(0, Math.min(100, currentData.domains[domain] + change))
  };

  const newOverall = Math.round(
    Object.values(newDomains).reduce((sum, val) => sum + val, 0) / 10
  );

  const newChange = {
    action,
    change,
    timestamp: new Date()
  };

  return {
    ...currentData,
    overall: newOverall,
    domains: newDomains,
    lastUpdated: new Date(),
    recentChanges: [...currentData.recentChanges.slice(-4), newChange] // Keep last 5 changes
  };
};

export const getRecoveryStrengthLabel = (percentage: number): string => {
  if (percentage >= 80) return "Fuel in the Tank";
  if (percentage >= 60) return "Your Momentum";
  return "Recovery Strength";
};

export const getRecoveryStrengthMessage = (percentage: number): string => {
  if (percentage >= 80) return "You're building serious strength. Stay steady.";
  if (percentage >= 60) return "Good momentum. Keep pushing forward.";
  if (percentage >= 40) return "You're building strength. Stay steady.";
  return "Every step forward counts. Keep going.";
};

// Track specific actions to domains
export const trackAction = (action: string): { domain: keyof RecoveryStrengthData['domains'], change: number } | null => {
  const actionMap: Record<string, { domain: keyof RecoveryStrengthData['domains'], change: number }> = {
    'journal_entry': { domain: 'confidence', change: 2 },
    'mood_log': { domain: 'mood', change: 2 },
    'breathing_session': { domain: 'selfCare', change: 3 },
    'urge_resisted': { domain: 'craving', change: 4 },
    'urge_acted': { domain: 'craving', change: -3 },
    'peer_chat': { domain: 'peerSupport', change: 3 },
    'foreman_chat': { domain: 'peerSupport', change: 2 },
    'tool_used': { domain: 'structure', change: 1 },
    'reflection_complete': { domain: 'meaning', change: 2 },
    'goal_set': { domain: 'goals', change: 3 },
    'weekly_checkin': { domain: 'satisfaction', change: 3 }
  };

  return actionMap[action] || null;
};
