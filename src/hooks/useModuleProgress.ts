import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  isCompleted: boolean;
  completedAt?: string;
  score?: number;
}

export interface ModuleMetrics {
  totalModules: number;
  completedModules: number;
  completionRate: number;
  moduleProgress: ModuleProgress[];
}

const CORE_MODULES = [
  { id: 'digital-ethics', name: 'Digital & Ethical Literacy' },
  { id: 'safety-risk', name: 'Safety & Risk Management' },
  { id: 'role-scope', name: 'Role & Scope of Practice' },
  { id: 'values-principles', name: 'Values & Principles' },
  { id: 'mutual-support', name: 'Self-Help & Mutual Support' }
];

export const useModuleProgress = (specialistId?: string) => {
  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetrics>({
    totalModules: CORE_MODULES.length,
    completedModules: 0,
    completionRate: 0,
    moduleProgress: CORE_MODULES.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      isCompleted: false
    }))
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Function to fetch module completion data
  const fetchModuleProgress = useCallback(async () => {
    if (!specialistId) return;

    try {
      // Query training_progress table for module completions
      // We'll use the training system to track module completions
      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('status', 'completed');

      if (error) throw error;

      // For now, we'll simulate module completion tracking
      // In a real implementation, you would have a modules table or use metadata
      // to track which specific modules are completed
      
      // Create a simple progress tracking based on completion count
      const completedCount = Math.min((data || []).length, CORE_MODULES.length);
      
      // Update module progress with simulated completion status
      const updatedProgress = CORE_MODULES.map((module, index) => {
        const isCompleted = index < completedCount;
        
        return {
          moduleId: module.id,
          moduleName: module.name,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
          score: isCompleted ? 100 : undefined
        };
      });

      const completionRate = (completedCount / CORE_MODULES.length) * 100;

      setModuleMetrics({
        totalModules: CORE_MODULES.length,
        completedModules: completedCount,
        completionRate,
        moduleProgress: updatedProgress
      });

    } catch (err) {
      console.error('Error fetching module progress:', err);
      setError('Failed to load module progress');
    }
  }, [specialistId]);

  // Function to mark a module as completed (simplified version using training_progress)
  const completeModule = useCallback(async (moduleId: string, score?: number) => {
    if (!specialistId) return false;

    try {
      // For now, we'll refresh the data since module completion
      // will be tracked through the actual training modules
      await fetchModuleProgress();
      return true;
    } catch (err) {
      console.error('Error completing module:', err);
      setError('Failed to complete module');
      return false;
    }
  }, [specialistId, fetchModuleProgress]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await fetchModuleProgress();
      setLoading(false);
    };

    if (specialistId) {
      loadData();
    }
  }, [specialistId, fetchModuleProgress]);

  // Set up real-time subscription for training progress changes
  useEffect(() => {
    if (!specialistId) return;

    const channel = supabase
      .channel('module-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_progress',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('Training progress changed (module check):', payload);
          fetchModuleProgress();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [specialistId, fetchModuleProgress]);

  return {
    moduleMetrics,
    loading,
    error,
    completeModule,
    refreshData: fetchModuleProgress
  };
};