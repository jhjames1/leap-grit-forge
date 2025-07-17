import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: Date;
}

export const useBadgeNotifications = () => {
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const { userData, updateUserData } = useUserData();

  // Calculate all earned badges
  const getEarnedBadges = (): Badge[] => {
    if (!userData) return [];
    
    const badges: Badge[] = [];
    const completedDays = userData.journeyProgress?.completedDays || [];
    const activityLog = userData.activityLog || [];
    const completionDates = userData.journeyProgress?.completionDates || {};
    
    // Week Warrior Badge - Complete 7 days
    if (completedDays.length >= 7) {
      const seventhDayIndex = completedDays[6];
      const earnedDate = completionDates[seventhDayIndex] 
        ? new Date(completionDates[seventhDayIndex])
        : new Date();
      
      badges.push({
        id: 'week-warrior',
        name: 'Week Warrior',
        icon: '🏆',
        description: 'Complete 7 days of recovery activities',
        earnedDate
      });
    }
    
    // Steady Breather Badge - Use breathing exercises 10 times
    const breathingCount = activityLog.filter(entry => 
      entry.action.includes('Breathing') || 
      entry.action.includes('SteadySteel')
    ).length;
    
    if (breathingCount >= 10) {
      const lastBreathingEntry = activityLog
        .filter(entry => entry.action.includes('Breathing') || entry.action.includes('SteadySteel'))
        .slice(9, 10)[0];
      
      badges.push({
        id: 'steady-breather',
        name: 'Steady Breather',
        icon: '🌬️',
        description: 'Use breathing exercises 10 times',
        earnedDate: new Date(lastBreathingEntry?.timestamp || Date.now())
      });
    }
    
    // Tool Master Badge - Use 5 different tools
    const uniqueTools = new Set();
    activityLog.forEach(entry => {
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
      badges.push({
        id: 'tool-master',
        name: 'Tool Master',
        icon: '🧰',
        description: 'Master 5 different recovery tools',
        earnedDate: new Date()
      });
    }
    
    // Journey Explorer Badge - Complete 30 days
    if (completedDays.length >= 30) {
      const thirtiethDayIndex = completedDays[29];
      const earnedDate = completionDates[thirtiethDayIndex] 
        ? new Date(completionDates[thirtiethDayIndex])
        : new Date();
      
      badges.push({
        id: 'journey-explorer',
        name: 'Journey Explorer',
        icon: '🗺️',
        description: 'Complete 30 days of your recovery journey',
        earnedDate
      });
    }
    
    // Streak Champion Badge - Maintain 14-day streak
    const currentStreak = userData.toolboxStats?.streak || 0;
    if (currentStreak >= 14) {
      badges.push({
        id: 'streak-champion',
        name: 'Streak Champion',
        icon: '🔥',
        description: 'Maintain a 14-day recovery streak',
        earnedDate: new Date()
      });
    }
    
    // Social Connector Badge - Use peer support 5 times
    const peerSupportCount = activityLog.filter(entry => 
      entry.action.includes('Peer') || 
      entry.action.includes('Chat')
    ).length;
    
    if (peerSupportCount >= 5) {
      badges.push({
        id: 'social-connector',
        name: 'Social Connector',
        icon: '👥',
        description: 'Connect with peer support 5 times',
        earnedDate: new Date()
      });
    }
    
    return badges;
  };

  // Check for new badges on user data change
  useEffect(() => {
    if (!userData) return;
    
    const currentBadges = getEarnedBadges();
    const lastSeenBadges = userData.lastSeenBadges || [];
    
    // Find badges that weren't seen before
    const newlyEarnedBadges = currentBadges.filter(badge => 
      !lastSeenBadges.includes(badge.id)
    );
    
    if (newlyEarnedBadges.length > 0) {
      setNewBadges(newlyEarnedBadges);
      setShowCelebration(true);
    }
  }, [userData]);

  const markBadgesAsSeen = () => {
    if (!userData || newBadges.length === 0) return;
    
    const currentLastSeen = userData.lastSeenBadges || [];
    const newLastSeen = [...currentLastSeen, ...newBadges.map(b => b.id)];
    
    updateUserData({
      lastSeenBadges: newLastSeen
    });
    
    setNewBadges([]);
    setShowCelebration(false);
  };

  return {
    newBadges,
    showCelebration,
    markBadgesAsSeen
  };
};