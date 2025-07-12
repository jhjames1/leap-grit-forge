import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MotivationalContent {
  id: string;
  title: string;
  content: string;
  content_type: 'quote' | 'video' | 'audio' | 'image';
  category: 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care';
  media_url?: string;
  author?: string;
  created_at: string;
}

interface ContentView {
  content_id: string;
  viewed_at: string;
  is_favorite: boolean;
}

export function useMotivationalContent(specialistId?: string) {
  const [todaysContent, setTodaysContent] = useState<MotivationalContent | null>(null);
  const [viewedContent, setViewedContent] = useState<ContentView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaysContent = async () => {
    if (!specialistId) return;

    try {
      // Get content that specialist hasn't seen recently (within last 7 days)
      const { data: recentViews } = await supabase
        .from('specialist_content_views')
        .select('content_id')
        .eq('specialist_id', specialistId)
        .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const viewedIds = recentViews?.map(v => v.content_id) || [];

      // Get available content excluding recently viewed
      const query = supabase
        .from('specialist_motivational_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (viewedIds.length > 0) {
        query.not('id', 'in', `(${viewedIds.join(',')})`);
      }

      const { data: content } = await query.limit(1);

      if (content && content.length > 0) {
        setTodaysContent(content[0] as MotivationalContent);
      } else {
        // If all content has been viewed recently, get the oldest viewed content
        const { data: oldestContent } = await supabase
          .from('specialist_motivational_content')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1);

        if (oldestContent && oldestContent.length > 0) {
          setTodaysContent(oldestContent[0] as MotivationalContent);
        }
      }
    } catch (error) {
      console.error('Error fetching motivational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (contentId: string, isFavorite = false) => {
    if (!specialistId) return;

    try {
      await supabase
        .from('specialist_content_views')
        .upsert({
          specialist_id: specialistId,
          content_id: contentId,
          is_favorite: isFavorite,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error marking content as viewed:', error);
    }
  };

  const toggleFavorite = async (contentId: string) => {
    if (!specialistId) return;

    try {
      const { data: existing } = await supabase
        .from('specialist_content_views')
        .select('is_favorite')
        .eq('specialist_id', specialistId)
        .eq('content_id', contentId)
        .single();

      await supabase
        .from('specialist_content_views')
        .upsert({
          specialist_id: specialistId,
          content_id: contentId,
          is_favorite: !existing?.is_favorite,
          viewed_at: new Date().toISOString()
        });

      // Update local state
      setViewedContent(prev => 
        prev.map(v => 
          v.content_id === contentId 
            ? { ...v, is_favorite: !v.is_favorite }
            : v
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    if (specialistId) {
      fetchTodaysContent();
    }
  }, [specialistId]);

  return {
    todaysContent,
    viewedContent,
    loading,
    markAsViewed,
    toggleFavorite,
    refetch: fetchTodaysContent
  };
}