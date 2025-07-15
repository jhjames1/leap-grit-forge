import { supabase } from "@/integrations/supabase/client";
import { journeyManager } from "./journeyManager";

export interface AIJourneyDay {
  day: number;
  title: string;
  content: string;
  activity: string;
  reflection: string;
  tips: string[];
  duration: string;
}

export interface AIJourney {
  id: string;
  journey_name: string;
  focus_area: string;
  days: AIJourneyDay[];
  created_at: string;
  is_active: boolean;
  version: number;
}

export interface AIPhaseModifier {
  id: string;
  phase_name: string;
  journey_stage: string;
  tone: string;
  pacing: string;
  extras: {
    focus_keywords: string[];
    support_level: string;
    challenge_level: string;
    common_struggles: string[];
    motivation_style: string;
  };
  is_active: boolean;
}

export interface UserJourneyAssignment {
  id: string;
  user_id: string;
  journey_id: string;
  phase_modifier_id?: string;
  assigned_at: string;
  is_active: boolean;
  journey?: AIJourney;
  phase_modifier?: AIPhaseModifier;
}

export interface Week1Data {
  triggers?: any;
  support_triangle?: any;
  core_why?: string;
  identity_words?: string[];
  safe_space?: string;
  reflection?: string;
  completed_at?: string;
}

export interface UserRecoveryPlan {
  id: string;
  user_id: string;
  plan_content: {
    core_why: string;
    triggers: any;
    support_triangle: any;
    identity_words: string[];
    safe_space: string;
    reflection: string;
    personalized_strategies: string[];
    phase_insights: string;
    generated_at: string;
  };
  generated_at: string;
  is_current: boolean;
}

class AIJourneyManager {
  private static instance: AIJourneyManager;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AIJourneyManager {
    if (!AIJourneyManager.instance) {
      AIJourneyManager.instance = new AIJourneyManager();
    }
    return AIJourneyManager.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): any {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  async getUserJourneyAssignment(userId: string): Promise<UserJourneyAssignment | null> {
    const cacheKey = `user_assignment_${userId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('user_journey_assignments')
        .select(`
          *,
          journey:ai_generated_journeys(*),
          phase_modifier:ai_phase_modifiers(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching user journey assignment:', error);
        return null;
      }

      const assignment = data?.[0] ? {
        ...data[0],
        journey: data[0].journey ? {
          ...data[0].journey,
          days: (data[0].journey.days as unknown) as AIJourneyDay[]
        } : undefined,
        phase_modifier: data[0].phase_modifier ? {
          ...data[0].phase_modifier,
          extras: (data[0].phase_modifier.extras as unknown) as any
        } : undefined
      } : null;
      this.setCache(cacheKey, assignment);
      return assignment;
    } catch (error) {
      console.error('Error fetching user journey assignment:', error);
      return null;
    }
  }

  async assignJourneyToUser(userId: string, focusAreas: string[], journeyStage?: string): Promise<UserJourneyAssignment | null> {
    try {
      // Find matching journey based on focus areas
      const journey = await this.findBestMatchingJourney(focusAreas);
      if (!journey) {
        console.error('No matching journey found for focus areas:', focusAreas);
        return null;
      }

      // Find phase modifier if journey stage provided
      let phaseModifier = null;
      if (journeyStage) {
        phaseModifier = await this.getPhaseModifierByStage(journeyStage);
      }

      // Deactivate any existing assignments
      await supabase
        .from('user_journey_assignments')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Create new assignment
      const { data, error } = await supabase
        .from('user_journey_assignments')
        .insert({
          user_id: userId,
          journey_id: journey.id,
          phase_modifier_id: phaseModifier?.id,
          is_active: true
        })
        .select(`
          *,
          journey:ai_generated_journeys(*),
          phase_modifier:ai_phase_modifiers(*)
        `);

      if (error) {
        console.error('Error assigning journey to user:', error);
        return null;
      }

      // Clear cache
      this.cache.delete(`user_assignment_${userId}`);
      
      return {
        ...data[0],
        journey: data[0].journey ? {
          ...data[0].journey,
          days: (data[0].journey.days as unknown) as AIJourneyDay[]
        } : undefined,
        phase_modifier: data[0].phase_modifier ? {
          ...data[0].phase_modifier,
          extras: (data[0].phase_modifier.extras as unknown) as any
        } : undefined
      };
    } catch (error) {
      console.error('Error assigning journey to user:', error);
      return null;
    }
  }

  async findBestMatchingJourney(focusAreas: string[]): Promise<AIJourney | null> {
    const cacheKey = `best_journey_${focusAreas.join('_')}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('ai_generated_journeys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching journeys:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Find best match based on focus areas
      // For now, use the first focus area to match
      const primaryFocus = focusAreas[0];
      const rawMatch = data.find(j => j.focus_area === primaryFocus) || data[0];
      
      const match = {
        ...rawMatch,
        days: (rawMatch.days as unknown) as AIJourneyDay[]
      };

      this.setCache(cacheKey, match);
      return match;
    } catch (error) {
      console.error('Error finding best matching journey:', error);
      return null;
    }
  }

  async getPhaseModifierByStage(journeyStage: string): Promise<AIPhaseModifier | null> {
    const cacheKey = `phase_modifier_${journeyStage}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('ai_phase_modifiers')
        .select('*')
        .eq('journey_stage', journeyStage)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error fetching phase modifier:', error);
        return null;
      }

      const modifier = data?.[0] ? {
        ...data[0],
        extras: (data[0].extras as unknown) as any
      } : null;
      this.setCache(cacheKey, modifier);
      return modifier;
    } catch (error) {
      console.error('Error fetching phase modifier:', error);
      return null;
    }
  }

  async getJourneyDay(assignment: UserJourneyAssignment, dayNumber: number): Promise<AIJourneyDay | null> {
    if (!assignment.journey) return null;

    const day = assignment.journey.days.find(d => d.day === dayNumber);
    if (!day) return null;

    // Apply phase modifier if available
    if (assignment.phase_modifier && dayNumber > 7) {
      return this.applyPhaseModifierToDay(day, assignment.phase_modifier);
    }

    return day;
  }

  private applyPhaseModifierToDay(day: AIJourneyDay, modifier: AIPhaseModifier): AIJourneyDay {
    // Apply tone and pacing adjustments to the day content
    const modifiedDay = { ...day };
    
    // Modify content based on phase modifier
    if (modifier.extras?.support_level === 'high') {
      modifiedDay.content = `${modifiedDay.content}\n\n💪 Remember: ${modifier.extras.motivation_style}`;
    }
    
    if (modifier.extras?.common_struggles?.length > 0) {
      modifiedDay.tips = [...modifiedDay.tips, `If you're struggling with ${modifier.extras.common_struggles[0]}, remember that this is normal for your current stage.`];
    }

    return modifiedDay;
  }

  // Week 1 Universal Data Collection Methods
  async saveWeek1Data(userId: string, dayNumber: number, data: Partial<Week1Data>): Promise<boolean> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('week1_universal_data')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing Week 1 data:', fetchError);
        return false;
      }

      const updateData = { ...data };
      
      // Mark as completed if this is Day 7
      if (dayNumber === 7) {
        updateData.completed_at = new Date().toISOString();
      }

      if (existing && existing.length > 0) {
        // Update existing record
        const { error } = await supabase
          .from('week1_universal_data')
          .update(updateData)
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating Week 1 data:', error);
          return false;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('week1_universal_data')
          .insert({
            user_id: userId,
            ...updateData
          });

        if (error) {
          console.error('Error inserting Week 1 data:', error);
          return false;
        }
      }

      // If Day 7 is completed, trigger recovery plan generation
      if (dayNumber === 7) {
        await this.generateRecoveryPlan(userId);
      }

      return true;
    } catch (error) {
      console.error('Error saving Week 1 data:', error);
      return false;
    }
  }

  async getWeek1Data(userId: string): Promise<Week1Data | null> {
    try {
      const { data, error } = await supabase
        .from('week1_universal_data')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Error fetching Week 1 data:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching Week 1 data:', error);
      return null;
    }
  }

  async generateRecoveryPlan(userId: string): Promise<boolean> {
    try {
      const week1Data = await this.getWeek1Data(userId);
      if (!week1Data) {
        console.error('No Week 1 data found for recovery plan generation');
        return false;
      }

      const assignment = await this.getUserJourneyAssignment(userId);
      
      const planContent = {
        core_why: week1Data.core_why || '',
        triggers: week1Data.triggers || {},
        support_triangle: week1Data.support_triangle || {},
        identity_words: week1Data.identity_words || [],
        safe_space: week1Data.safe_space || '',
        reflection: week1Data.reflection || '',
        personalized_strategies: this.generatePersonalizedStrategies(week1Data),
        phase_insights: assignment?.phase_modifier?.tone || 'Keep building your foundation',
        generated_at: new Date().toISOString()
      };

      // Deactivate existing plans
      await supabase
        .from('user_recovery_plans')
        .update({ is_current: false })
        .eq('user_id', userId);

      // Create new plan
      const { error } = await supabase
        .from('user_recovery_plans')
        .insert({
          user_id: userId,
          plan_content: planContent,
          is_current: true
        });

      if (error) {
        console.error('Error generating recovery plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error generating recovery plan:', error);
      return false;
    }
  }

  private generatePersonalizedStrategies(week1Data: Week1Data): string[] {
    const strategies: string[] = [];
    
    if (week1Data.core_why) {
      strategies.push(`Remember your core why: ${week1Data.core_why}`);
    }
    
    if (week1Data.identity_words && week1Data.identity_words.length > 0) {
      strategies.push(`Embody your identity words: ${week1Data.identity_words.join(', ')}`);
    }
    
    if (week1Data.safe_space) {
      strategies.push(`Use your safe space: ${week1Data.safe_space}`);
    }
    
    strategies.push('Continue your daily journey activities');
    strategies.push('Practice the tools you\'ve learned');
    strategies.push('Stay connected with your support network');
    
    return strategies;
  }

  async getCurrentRecoveryPlan(userId: string): Promise<UserRecoveryPlan | null> {
    try {
      const { data, error } = await supabase
        .from('user_recovery_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .limit(1);

      if (error) {
        console.error('Error fetching recovery plan:', error);
        return null;
      }

      return data?.[0] ? {
        ...data[0],
        plan_content: (data[0].plan_content as unknown) as any
      } : null;
    } catch (error) {
      console.error('Error fetching recovery plan:', error);
      return null;
    }
  }

  // Fallback methods for compatibility with existing system
  async getJourneyWithFallback(focusAreas: string[]): Promise<any> {
    const assignment = await this.findBestMatchingJourney(focusAreas);
    if (assignment) {
      return assignment;
    }
    
    // Fallback to existing journey manager
    return journeyManager.getUserJourney(focusAreas);
  }

  async getJourneyDayWithFallback(focusAreas: string[], dayNumber: number): Promise<any> {
    const assignment = await this.findBestMatchingJourney(focusAreas);
    if (assignment) {
      const day = assignment.days.find(d => d.day === dayNumber);
      if (day) return day;
    }
    
    // Fallback to existing journey manager
    return journeyManager.getJourneyDay(focusAreas, dayNumber);
  }
}

export const aiJourneyManager = AIJourneyManager.getInstance();