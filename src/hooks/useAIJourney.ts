import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { aiJourneyManager, UserJourneyAssignment, AIJourneyDay, Week1Data, UserRecoveryPlan } from '@/utils/aiJourneyManager';
import { useUserData } from './useUserData';

export interface UseAIJourneyReturn {
  // Journey assignment
  assignment: UserJourneyAssignment | null;
  isAssignmentLoading: boolean;
  
  // Journey operations
  assignJourney: (focusAreas: string[], journeyStage?: string) => Promise<boolean>;
  getJourneyDay: (dayNumber: number) => Promise<AIJourneyDay | null>;
  
  // Week 1 data collection
  week1Data: Week1Data | null;
  saveWeek1Data: (dayNumber: number, data: Partial<Week1Data>) => Promise<boolean>;
  
  // Recovery plan
  recoveryPlan: UserRecoveryPlan | null;
  refreshRecoveryPlan: () => Promise<void>;
  
  // Utilities
  hasAIJourney: boolean;
  isWeek1Complete: boolean;
  refresh: () => Promise<void>;
}

export const useAIJourney = (): UseAIJourneyReturn => {
  const { session } = useAuth();
  const { userData } = useUserData();
  
  const [assignment, setAssignment] = useState<UserJourneyAssignment | null>(null);
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(false);
  const [week1Data, setWeek1Data] = useState<Week1Data | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<UserRecoveryPlan | null>(null);

  const userId = session?.user?.id;

  // Load user's journey assignment
  useEffect(() => {
    if (!userId) return;
    
    const loadAssignment = async () => {
      setIsAssignmentLoading(true);
      try {
        const userAssignment = await aiJourneyManager.getUserJourneyAssignment(userId);
        setAssignment(userAssignment);
      } catch (error) {
        console.error('Error loading journey assignment:', error);
      } finally {
        setIsAssignmentLoading(false);
      }
    };

    loadAssignment();
  }, [userId]);

  // Load Week 1 data
  useEffect(() => {
    if (!userId) return;
    
    const loadWeek1Data = async () => {
      try {
        const data = await aiJourneyManager.getWeek1Data(userId);
        setWeek1Data(data);
      } catch (error) {
        console.error('Error loading Week 1 data:', error);
      }
    };

    loadWeek1Data();
  }, [userId]);

  // Load recovery plan
  useEffect(() => {
    if (!userId) return;
    
    const loadRecoveryPlan = async () => {
      try {
        const plan = await aiJourneyManager.getCurrentRecoveryPlan(userId);
        setRecoveryPlan(plan);
      } catch (error) {
        console.error('Error loading recovery plan:', error);
      }
    };

    loadRecoveryPlan();
  }, [userId]);

  // Auto-assign journey based on user data
  useEffect(() => {
    if (!userId || !userData || assignment) return;
    
    const autoAssignJourney = async () => {
      if (userData.focusAreas && userData.focusAreas.length > 0) {
        console.log('Auto-assigning journey based on user focus areas:', userData.focusAreas);
        await assignJourney(userData.focusAreas, userData.journeyStage);
      }
    };

    autoAssignJourney();
  }, [userId, userData, assignment]);

  const assignJourney = async (focusAreas: string[], journeyStage?: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const newAssignment = await aiJourneyManager.assignJourneyToUser(userId, focusAreas, journeyStage);
      if (newAssignment) {
        setAssignment(newAssignment);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error assigning journey:', error);
      return false;
    }
  };

  const getJourneyDay = async (dayNumber: number): Promise<AIJourneyDay | null> => {
    if (!assignment) return null;
    
    try {
      return await aiJourneyManager.getJourneyDay(assignment, dayNumber);
    } catch (error) {
      console.error('Error getting journey day:', error);
      return null;
    }
  };

  const saveWeek1Data = async (dayNumber: number, data: Partial<Week1Data>): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const success = await aiJourneyManager.saveWeek1Data(userId, dayNumber, data);
      if (success) {
        // Refresh Week 1 data
        const updatedData = await aiJourneyManager.getWeek1Data(userId);
        setWeek1Data(updatedData);
        
        // If Day 7 was completed, refresh recovery plan
        if (dayNumber === 7) {
          setTimeout(async () => {
            const plan = await aiJourneyManager.getCurrentRecoveryPlan(userId);
            setRecoveryPlan(plan);
          }, 1000);
        }
      }
      return success;
    } catch (error) {
      console.error('Error saving Week 1 data:', error);
      return false;
    }
  };

  const refreshRecoveryPlan = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      const plan = await aiJourneyManager.getCurrentRecoveryPlan(userId);
      setRecoveryPlan(plan);
    } catch (error) {
      console.error('Error refreshing recovery plan:', error);
    }
  };

  const refresh = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      setIsAssignmentLoading(true);
      
      // Refresh all data
      const [userAssignment, week1, plan] = await Promise.all([
        aiJourneyManager.getUserJourneyAssignment(userId),
        aiJourneyManager.getWeek1Data(userId),
        aiJourneyManager.getCurrentRecoveryPlan(userId)
      ]);
      
      setAssignment(userAssignment);
      setWeek1Data(week1);
      setRecoveryPlan(plan);
    } catch (error) {
      console.error('Error refreshing AI journey data:', error);
    } finally {
      setIsAssignmentLoading(false);
    }
  };

  const hasAIJourney = !!assignment;
  const isWeek1Complete = !!week1Data?.completed_at;

  return {
    assignment,
    isAssignmentLoading,
    assignJourney,
    getJourneyDay,
    week1Data,
    saveWeek1Data,
    recoveryPlan,
    refreshRecoveryPlan,
    hasAIJourney,
    isWeek1Complete,
    refresh
  };
};