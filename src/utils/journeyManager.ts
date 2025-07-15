import journeyData from '@/data/journeyData.json';
import { logger } from './logger';

export interface JourneyDay {
  day: number;
  title: string;
  keyMessage: string;
  activity: string;
  tool: string;
}

export interface CoreJourney {
  focusArea: string;
  days: JourneyDay[];
}

export interface PhaseModifier {
  phase: string;
  tone: string;
  pacing: string;
  optionalExtras: string[];
}

// Focus area mapping from onboarding to journey
const FOCUS_AREA_MAPPING: Record<string, string> = {
  'tough-moments': 'Craving Control',
  'connections': 'Connection Boost', 
  'routines': 'Routine Builder',
  'tools': 'Toolbox Mastery',
  'staying-track': 'Accountability Path'
};

// Journey stage mapping from onboarding to phase
const JOURNEY_STAGE_MAPPING: Record<string, string> = {
  'starting': 'Just Starting Out',
  'few-weeks': 'A Few Weeks In',
  'few-months': 'A Few Months Strong',
  'steady': 'Feeling Steady',
  'starting-again': 'Restarting After a Pause'
};

export class JourneyManager {
  private static instance: JourneyManager;
  private coreJourneys: CoreJourney[];
  private phaseModifiers: PhaseModifier[];

  private constructor() {
    this.coreJourneys = journeyData.coreJourneys;
    this.phaseModifiers = journeyData.phaseModifiers;
    logger.debug('JourneyManager initialized', { 
      journeyCount: this.coreJourneys.length,
      modifierCount: this.phaseModifiers.length 
    });
  }

  public static getInstance(): JourneyManager {
    if (!JourneyManager.instance) {
      JourneyManager.instance = new JourneyManager();
    }
    return JourneyManager.instance;
  }

  /**
   * Get user's assigned journey based on their onboarding focus area
   */
  public getUserJourney(focusAreas: string[]): CoreJourney | null {
    if (!focusAreas || focusAreas.length === 0) {
      logger.warn('No focus areas provided, defaulting to Craving Control');
      return this.getJourneyByFocusArea('Craving Control');
    }

    // Use the first focus area for journey mapping
    const primaryFocusArea = focusAreas[0];
    const mappedJourneyName = FOCUS_AREA_MAPPING[primaryFocusArea];
    
    if (!mappedJourneyName) {
      logger.warn('Unknown focus area, defaulting to Craving Control', { focusArea: primaryFocusArea });
      return this.getJourneyByFocusArea('Craving Control');
    }

    const journey = this.getJourneyByFocusArea(mappedJourneyName);
    logger.debug('User journey mapped', { 
      focusArea: primaryFocusArea, 
      journeyName: mappedJourneyName,
      found: !!journey 
    });
    
    return journey;
  }

  /**
   * Get phase modifier based on user's journey stage
   */
  public getPhaseModifier(journeyStage: string): PhaseModifier | null {
    const mappedPhase = JOURNEY_STAGE_MAPPING[journeyStage];
    
    if (!mappedPhase) {
      logger.warn('Unknown journey stage, defaulting to Just Starting Out', { stage: journeyStage });
      return this.getModifierByPhase('Just Starting Out');
    }

    const modifier = this.getModifierByPhase(mappedPhase);
    logger.debug('Phase modifier mapped', { 
      stage: journeyStage, 
      phase: mappedPhase,
      found: !!modifier 
    });
    
    return modifier;
  }

  /**
   * Get specific day from user's journey
   */
  public getJourneyDay(focusAreas: string[], dayNumber: number): JourneyDay | null {
    const journey = this.getUserJourney(focusAreas);
    if (!journey || dayNumber < 1 || dayNumber > journey.days.length) {
      return null;
    }
    
    return journey.days[dayNumber - 1];
  }

  /**
   * Get all days for a specific week
   */
  public getJourneyWeek(focusAreas: string[], weekNumber: number): JourneyDay[] {
    const journey = this.getUserJourney(focusAreas);
    if (!journey) return [];

    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = Math.min(startDay + 6, journey.days.length);
    
    return journey.days.slice(startDay - 1, endDay);
  }

  /**
   * Check if a day should be unlocked based on completion and time
   */
  public isDayUnlocked(
    completedDays: number[], 
    dayNumber: number, 
    currentTime: Date = new Date(),
    completionDates?: Record<number, Date>,
    testingMode: boolean = false
  ): boolean {
    // Testing mode bypasses all restrictions
    if (testingMode) {
      return true;
    }

    // Day 1 is always unlocked
    if (dayNumber === 1) return true;

    // Previous day must be completed
    const previousDayCompleted = completedDays.includes(dayNumber - 1);
    if (!previousDayCompleted) return false;

    // If we have completion dates, use them for accurate timing
    if (completionDates && completionDates[dayNumber - 1]) {
      const completionDate = completionDates[dayNumber - 1];
      const nextDay = new Date(completionDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 1, 0, 0); // 12:01 AM the next day
      
      return currentTime >= nextDay;
    }

    // Fallback: if no completion dates available, be restrictive
    // Only unlock if it's a different calendar day than when we might have completed
    const today = new Date(currentTime);
    today.setHours(0, 1, 0, 0); // 12:01 AM today
    
    // This is conservative - requires waiting until 12:01 AM of the next calendar day
    return currentTime >= today;
  }

  /**
   * Apply phase modifier to journey content
   */
  public applyPhaseModifier(
    content: JourneyDay, 
    modifier: PhaseModifier
  ): JourneyDay & { modifiedTone: string; modifiedPacing: string } {
    return {
      ...content,
      modifiedTone: modifier.tone,
      modifiedPacing: modifier.pacing
    };
  }

  private getJourneyByFocusArea(focusArea: string): CoreJourney | null {
    return this.coreJourneys.find(journey => journey.focusArea === focusArea) || null;
  }

  private getModifierByPhase(phase: string): PhaseModifier | null {
    return this.phaseModifiers.find(modifier => modifier.phase === phase) || null;
  }

  /**
   * Get all available journey focus areas
   */
  public getAvailableJourneys(): string[] {
    return this.coreJourneys.map(journey => journey.focusArea);
  }

  /**
   * Get all available phase modifiers
   */
  public getAvailablePhases(): string[] {
    return this.phaseModifiers.map(modifier => modifier.phase);
  }
}

export const journeyManager = JourneyManager.getInstance();