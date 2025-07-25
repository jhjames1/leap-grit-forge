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
      // Query the new specialist_module_progress table for module completions
      const { data, error } = await supabase
        .from('specialist_module_progress')
        .select('*')
        .eq('specialist_id', specialistId);

      if (error) throw error;

      // Create a set of completed module IDs
      const completedModuleIds = new Set<string>();
      const moduleScores = new Map<string, number>();
      const moduleCompletionDates = new Map<string, string>();
      
      // Process the data to identify completed modules
      (data || []).forEach(item => {
        if (item.is_completed) {
          completedModuleIds.add(item.module_id);
          if (item.score) moduleScores.set(item.module_id, item.score);
          if (item.completed_at) moduleCompletionDates.set(item.module_id, item.completed_at);
        }
      });

      // Update module progress with completion status
      const updatedProgress = CORE_MODULES.map(module => {
        const isCompleted = completedModuleIds.has(module.id);
        
        return {
          moduleId: module.id,
          moduleName: module.name,
          isCompleted,
          completedAt: isCompleted ? moduleCompletionDates.get(module.id) : undefined,
          score: isCompleted ? moduleScores.get(module.id) : undefined
        };
      });

      const completedCount = completedModuleIds.size;
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

  // Function to mark a module as completed
  const completeModule = useCallback(async (moduleId: string, score?: number) => {
    if (!specialistId) return false;

    try {
      // Insert or update module completion record
      const { error } = await supabase
        .from('specialist_module_progress')
        .upsert({
          specialist_id: specialistId,
          module_id: moduleId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          score: score || null
        });

      if (error) throw error;

      // Refresh module progress
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

  // Set up real-time subscription for module progress changes
  useEffect(() => {
    if (!specialistId) return;

    const channel = supabase
      .channel('module-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialist_module_progress',
          filter: `specialist_id=eq.${specialistId}`
        },
        (payload) => {
          console.log('Module progress changed:', payload);
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