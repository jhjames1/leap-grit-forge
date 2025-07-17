export interface Badge {
  id: string;
  name: string;
  earnedDate: Date;
  icon: string;
  description: string;
  earned: string;
}

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 14) return '1 week ago';
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

export const getEarnedBadges = (userData: any, t: (key: string) => string, liveRecoveryStreak: number = 0): Badge[] => {
  const badges: Badge[] = [];
  const completedDays = userData?.journeyProgress?.completedDays || [];
  const activityLog = userData?.activityLog || [];
  const completionDates = userData?.journeyProgress?.completionDates || {};
  
  // Week Warrior Badge - Complete 7 days
  if (completedDays.length >= 7) {
    const seventhDayIndex = completedDays[6]; // 7th completed day
    const earnedDate = completionDates[seventhDayIndex] 
      ? new Date(completionDates[seventhDayIndex])
      : new Date();
    
    badges.push({
      id: 'weekWarrior',
      name: t('profile.badges.weekWarrior'),
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "🏆",
      description: "Complete 7 days of recovery activities"
    });
  }
  
  // Steady Breather Badge - Use breathing exercises 10 times
  const breathingCount = activityLog.filter((entry: any) => 
    entry.action.includes('Breathing') || 
    entry.action.includes('SteadySteel')
  ).length;
  
  if (breathingCount >= 10) {
    const lastBreathingEntry = activityLog
      .filter((entry: any) => entry.action.includes('Breathing') || entry.action.includes('SteadySteel'))
      .slice(9, 10)[0]; // 10th entry
    
    const earnedDate = new Date(lastBreathingEntry?.timestamp || Date.now());
    
    badges.push({
      id: 'steadyBreather',
      name: t('profile.badges.steadyBreather'),
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "🌬️",
      description: "Use breathing exercises 10 times"
    });
  }
  
  // Tool Master Badge - Use 5 different tools
  const uniqueTools = new Set();
  activityLog.forEach((entry: any) => {
    if (entry.action.includes('Completed')) {
      if (entry.action.includes('SteadySteel')) uniqueTools.add('SteadySteel');
      if (entry.action.includes('Redline Recovery')) uniqueTools.add('Redline Recovery');
      if (entry.action.includes('Gratitude')) uniqueTools.add('Gratitude Log');
      if (entry.action.includes('Trigger')) uniqueTools.add('Trigger Identifier');
      if (entry.action.includes('Foreman')) uniqueTools.add('The Foreman');
      if (entry.action.includes('Peer')) uniqueTools.add('Peer Support');
    }
  });
  
  if (uniqueTools.size >= 5) {
    const earnedDate = new Date();
    badges.push({
      id: 'toolMaster',
      name: t('profile.badges.toolMaster'),
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "🧰",
      description: "Master 5 different recovery tools"
    });
  }
  
  // Journey Explorer Badge - Complete 30 days
  if (completedDays.length >= 30) {
    const thirtiethDayIndex = completedDays[29]; // 30th completed day
    const earnedDate = completionDates[thirtiethDayIndex] 
      ? new Date(completionDates[thirtiethDayIndex])
      : new Date();
    
    badges.push({
      id: 'journeyExplorer',
      name: "Journey Explorer",
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "🗺️",
      description: "Complete 30 days of your recovery journey"
    });
  }
  
  // Streak Champion Badge - Maintain 14-day streak
  if (liveRecoveryStreak >= 14) {
    const earnedDate = new Date();
    badges.push({
      id: 'streakChampion',
      name: "Streak Champion",
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "🔥",
      description: "Maintain a 14-day recovery streak"
    });
  }
  
  // Social Connector Badge - Use peer support 5 times
  const peerSupportCount = activityLog.filter((entry: any) => 
    entry.action.includes('Peer') || 
    entry.action.includes('Chat')
  ).length;
  
  if (peerSupportCount >= 5) {
    const earnedDate = new Date();
    badges.push({
      id: 'socialConnector',
      name: "Social Connector",
      earnedDate,
      earned: formatTimeAgo(earnedDate),
      icon: "👥",
      description: "Connect with peer support 5 times"
    });
  }
  
  return badges;
};

export const getMostRecentBadge = (userData: any, t: (key: string) => string, liveRecoveryStreak: number = 0): Badge | null => {
  const badges = getEarnedBadges(userData, t, liveRecoveryStreak);
  
  if (badges.length === 0) return null;
  
  // Sort badges by earned date (most recent first)
  return badges.sort((a, b) => b.earnedDate.getTime() - a.earnedDate.getTime())[0];
};