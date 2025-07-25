-- Fix the ambiguous column reference in get_specialist_training_summary function
CREATE OR REPLACE FUNCTION public.get_specialist_training_summary(p_specialist_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_scenarios', (SELECT COUNT(*) FROM training_scenarios WHERE is_active = true),
    'completed_scenarios', (
      SELECT COUNT(*) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'completed'
    ),
    'in_progress_scenarios', (
      SELECT COUNT(*) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'in_progress'
    ),
    'average_score', (
      SELECT COALESCE(AVG(score), 0) 
      FROM training_progress 
      WHERE specialist_id = p_specialist_id AND status = 'completed' AND score IS NOT NULL
    ),
    'categories_progress', (
      SELECT jsonb_object_agg(
        category_totals.category,
        jsonb_build_object(
          'total', category_totals.total,
          'completed', COALESCE(category_completed.completed, 0)
        )
      )
      FROM (
        SELECT category, COUNT(*) as total 
        FROM training_scenarios 
        WHERE is_active = true 
        GROUP BY category
      ) category_totals
      LEFT JOIN (
        SELECT ts.category, COUNT(*) as completed
        FROM training_progress tp
        JOIN training_scenarios ts ON ts.id = tp.scenario_id
        WHERE tp.specialist_id = p_specialist_id AND tp.status = 'completed'
        GROUP BY ts.category
      ) category_completed ON category_totals.category = category_completed.category
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'scenario_title', ts.title,
          'status', tp.status,
          'completed_at', tp.completed_at,
          'score', tp.score
        )
      )
      FROM training_progress tp
      JOIN training_scenarios ts ON ts.id = tp.scenario_id
      WHERE tp.specialist_id = p_specialist_id
      ORDER BY tp.updated_at DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$function$