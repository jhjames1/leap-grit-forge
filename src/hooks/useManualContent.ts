import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ManualSection {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
}

interface ManualContent {
  id: string;
  section_id: string;
  title: string;
  content: string;
  content_type: string;
  order_index: number;
  is_active: boolean;
}

interface ManualChangeTracking {
  id: string;
  file_path: string;
  change_type: string;
  affected_sections: string[];
  change_description: string | null;
  auto_updated: boolean;
  requires_review: boolean;
  created_at: string;
}

export const useManualContent = () => {
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [content, setContent] = useState<Record<string, ManualContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_sections')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manual sections');
    }
  };

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_content')
        .select('*')
        .eq('is_active', true)
        .order('section_id, order_index');

      if (error) throw error;
      
      // Group content by section_id
      const contentBySection = (data || []).reduce((acc, item) => {
        if (!acc[item.section_id]) {
          acc[item.section_id] = [];
        }
        acc[item.section_id].push(item);
        return acc;
      }, {} as Record<string, ManualContent[]>);

      setContent(contentBySection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manual content');
    }
  };

  const trackChange = async (filePath: string, changeType: string, affectedSections: string[], description?: string) => {
    try {
      const { error } = await supabase
        .from('manual_change_tracking')
        .insert({
          file_path: filePath,
          change_type: changeType,
          affected_sections: affectedSections,
          change_description: description,
          auto_updated: false,
          requires_review: true
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to track manual change:', err);
    }
  };

  const refreshContent = async () => {
    setLoading(true);
    await Promise.all([fetchSections(), fetchContent()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshContent();

    // Subscribe to real-time updates
    const sectionsChannel = supabase
      .channel('manual_sections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_sections'
        },
        () => {
          fetchSections();
        }
      )
      .subscribe();

    const contentChannel = supabase
      .channel('manual_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_content'
        },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sectionsChannel);
      supabase.removeChannel(contentChannel);
    };
  }, []);

  return {
    sections,
    content,
    loading,
    error,
    refreshContent,
    trackChange
  };
};

export const useManualChangeTracking = () => {
  const [changes, setChanges] = useState<ManualChangeTracking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingChanges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_change_tracking')
        .select('*')
        .eq('requires_review', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChanges(data || []);
    } catch (err) {
      console.error('Failed to fetch pending changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const markChangeReviewed = async (changeId: string) => {
    try {
      const { error } = await supabase
        .from('manual_change_tracking')
        .update({
          requires_review: false,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) throw error;
      await fetchPendingChanges();
    } catch (err) {
      console.error('Failed to mark change as reviewed:', err);
    }
  };

  return {
    changes,
    loading,
    fetchPendingChanges,
    markChangeReviewed
  };
};