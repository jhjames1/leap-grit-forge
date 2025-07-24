import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'crisis' | 'difficult' | 'routine' | 'general';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  scenario_data: {
    mock_user: {
      name: string;
      mood: string;
      first_time?: boolean;
      risk_level?: string;
      personality?: string;
      progress_status?: string;
    };
    initial_messages: Array<{
      from: 'user' | 'specialist';
      message: string;
      timestamp: number;
    }>;
    expected_response_elements: string[];
    evaluation_criteria: Record<string, string>;
  };
  learning_objectives: string[];
  estimated_duration_minutes: number;
  prerequisites: string[];
}

export interface TrainingProgress {
  id: string;
  scenario_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  score?: number;
  feedback?: Record<string, any>;
  attempt_number: number;
  time_spent_minutes?: number;
}

export interface TrainingSummary {
  total_scenarios: number;
  completed_scenarios: number;
  in_progress_scenarios: number;
  average_score: number;
  categories_progress: Record<string, { total: number; completed: number }>;
  recent_activity: Array<{
    scenario_title: string;
    status: string;
    completed_at?: string;
    score?: number;
  }>;
}

export const useTrainingScenarios = (specialistId?: string) => {
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [summary, setSummary] = useState<TrainingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available training scenarios
  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: TrainingScenario[] = (data || []).map(item => ({
        ...item,
        category: item.category as TrainingScenario['category'],
        difficulty_level: item.difficulty_level as TrainingScenario['difficulty_level'],
        scenario_data: item.scenario_data as TrainingScenario['scenario_data']
      }));
      
      setScenarios(transformedData);
    } catch (err) {
      console.error('Error fetching training scenarios:', err);
      setError('Failed to load training scenarios');
    }
  };

  // Fetch specialist's training progress
  const fetchProgress = async () => {
    if (!specialistId) return;

    try {
      const { data, error } = await supabase
        .from('training_progress')
        .select(`
          *,
          training_scenarios!inner(title)
        `)
        .eq('specialist_id', specialistId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: TrainingProgress[] = (data || []).map(item => ({
        id: item.id,
        scenario_id: item.scenario_id,
        status: item.status as TrainingProgress['status'],
        started_at: item.started_at,
        completed_at: item.completed_at,
        score: item.score,
        feedback: item.feedback as Record<string, any>,
        attempt_number: item.attempt_number,
        time_spent_minutes: item.time_spent_minutes
      }));
      
      setProgress(transformedData);
    } catch (err) {
      console.error('Error fetching training progress:', err);
      setError('Failed to load training progress');
    }
  };

  // Fetch training summary
  const fetchSummary = async () => {
    if (!specialistId) return;

    try {
      const { data, error } = await supabase.rpc('get_specialist_training_summary', {
        p_specialist_id: specialistId
      });

      if (error) throw error;
      setSummary(data ? (data as unknown as TrainingSummary) : null);
    } catch (err) {
      console.error('Error fetching training summary:', err);
      setError('Failed to load training summary');
    }
  };

  // Start a training scenario
  const startScenario = async (scenarioId: string): Promise<boolean> => {
    if (!specialistId) return false;

    try {
      // Check if already in progress
      const existingProgress = progress.find(
        p => p.scenario_id === scenarioId && p.status === 'in_progress'
      );

      if (existingProgress) {
        return true; // Already in progress
      }

      // Get the next attempt number
      const existingAttempts = progress.filter(p => p.scenario_id === scenarioId);
      const nextAttemptNumber = existingAttempts.length + 1;

      const { data, error } = await supabase
        .from('training_progress')
        .insert({
          specialist_id: specialistId,
          scenario_id: scenarioId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          attempt_number: nextAttemptNumber
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh progress
      await fetchProgress();
      await fetchSummary();
      
      return true;
    } catch (err) {
      console.error('Error starting training scenario:', err);
      setError('Failed to start training scenario');
      return false;
    }
  };

  // Complete a training scenario
  const completeScenario = async (
    progressId: string, 
    score: number, 
    feedback: Record<string, any> = {},
    timeSpentMinutes: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('training_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          score,
          feedback,
          time_spent_minutes: timeSpentMinutes
        })
        .eq('id', progressId);

      if (error) throw error;

      // Refresh progress and summary
      await fetchProgress();
      await fetchSummary();
      
      return true;
    } catch (err) {
      console.error('Error completing training scenario:', err);
      setError('Failed to complete training scenario');
      return false;
    }
  };

  // Log training session action
  const logTrainingAction = async (
    progressId: string,
    actionType: string,
    actionData: Record<string, any>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('training_session_logs')
        .insert({
          progress_id: progressId,
          action_type: actionType,
          action_data: actionData
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error logging training action:', err);
      return false;
    }
  };

  // Get scenarios by category
  const getScenariosByCategory = (category: string) => {
    return scenarios.filter(s => s.category === category);
  };

  // Get progress for a specific scenario
  const getScenarioProgress = (scenarioId: string) => {
    return progress.filter(p => p.scenario_id === scenarioId);
  };

  // Check if scenario is available (prerequisites met)
  const isScenarioAvailable = (scenario: TrainingScenario): boolean => {
    if (!scenario.prerequisites || scenario.prerequisites.length === 0) {
      return true;
    }

    // Check if all prerequisite scenarios are completed
    return scenario.prerequisites.every(prereqTitle => {
      const prereqScenario = scenarios.find(s => s.title === prereqTitle);
      if (!prereqScenario) return false;
      
      const prereqProgress = progress.find(
        p => p.scenario_id === prereqScenario.id && p.status === 'completed'
      );
      return !!prereqProgress;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchScenarios(),
        fetchProgress(),
        fetchSummary()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, [specialistId]);

  return {
    scenarios,
    progress,
    summary,
    loading,
    error,
    startScenario,
    completeScenario,
    logTrainingAction,
    getScenariosByCategory,
    getScenarioProgress,
    isScenarioAvailable,
    refreshData: () => {
      fetchScenarios();
      fetchProgress();
      fetchSummary();
    }
  };
};