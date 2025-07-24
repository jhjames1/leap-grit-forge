-- Create training scenarios table
CREATE TABLE public.training_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'crisis', 'routine', 'difficult', 'onboarding'
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  scenario_data JSONB NOT NULL DEFAULT '{}', -- Contains mock user messages, expected responses, etc.
  learning_objectives TEXT[] DEFAULT '{}',
  estimated_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  prerequisites TEXT[] DEFAULT '{}', -- Required completed scenarios
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training progress tracking table
CREATE TABLE public.training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.training_scenarios(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER, -- 0-100 performance score
  feedback JSONB DEFAULT '{}', -- Detailed feedback on performance
  attempt_number INTEGER NOT NULL DEFAULT 1,
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, scenario_id, attempt_number)
);

-- Create training session logs table
CREATE TABLE public.training_session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  progress_id UUID NOT NULL REFERENCES public.training_progress(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'message_sent', 'response_evaluated', 'hint_used', etc.
  action_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_scenarios
CREATE POLICY "Anyone can view active training scenarios" 
ON public.training_scenarios 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage training scenarios" 
ON public.training_scenarios 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for training_progress
CREATE POLICY "Specialists can view their own training progress" 
ON public.training_progress 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = training_progress.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "Specialists can create their own training progress" 
ON public.training_progress 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = training_progress.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "Specialists can update their own training progress" 
ON public.training_progress 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = training_progress.specialist_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all training progress" 
ON public.training_progress 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for training_session_logs
CREATE POLICY "Specialists can manage their own training session logs" 
ON public.training_session_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM training_progress tp
  JOIN peer_specialists ps ON ps.id = tp.specialist_id
  WHERE tp.id = training_session_logs.progress_id AND ps.user_id = auth.uid()
));

CREATE POLICY "Admins can view all training session logs" 
ON public.training_session_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create indexes for better performance
CREATE INDEX idx_training_scenarios_category ON public.training_scenarios(category);
CREATE INDEX idx_training_scenarios_difficulty ON public.training_scenarios(difficulty_level);
CREATE INDEX idx_training_progress_specialist ON public.training_progress(specialist_id);
CREATE INDEX idx_training_progress_scenario ON public.training_progress(scenario_id);
CREATE INDEX idx_training_progress_status ON public.training_progress(status);
CREATE INDEX idx_training_session_logs_progress ON public.training_session_logs(progress_id);

-- Insert some initial training scenarios
INSERT INTO public.training_scenarios (title, description, category, difficulty_level, scenario_data, learning_objectives, estimated_duration_minutes) VALUES
(
  'Basic Chat Introduction',
  'Learn how to properly introduce yourself and make users feel welcome in their first chat session.',
  'onboarding',
  1,
  '{
    "mock_user": {
      "name": "Alex",
      "mood": "nervous",
      "first_time": true
    },
    "initial_messages": [
      {
        "from": "user",
        "message": "Hi... I''ve never done this before. I''m not sure what to expect.",
        "timestamp": 0
      }
    ],
    "expected_response_elements": [
      "warm_greeting",
      "reassurance",
      "explanation_of_process",
      "confidentiality_mention"
    ],
    "evaluation_criteria": {
      "empathy": "Did you acknowledge their nervousness?",
      "professionalism": "Did you maintain appropriate boundaries?",
      "clarity": "Did you explain what to expect clearly?"
    }
  }',
  ARRAY['Professional greeting', 'Building rapport', 'Setting expectations', 'Addressing anxiety'],
  10
),
(
  'Crisis Situation Response',
  'Practice responding to a user expressing thoughts of self-harm while following proper protocols.',
  'crisis',
  4,
  '{
    "mock_user": {
      "name": "Jordan",
      "mood": "distressed",
      "risk_level": "moderate"
    },
    "initial_messages": [
      {
        "from": "user",
        "message": "I don''t think I can keep going like this. Sometimes I think everyone would be better off without me.",
        "timestamp": 0
      }
    ],
    "expected_response_elements": [
      "immediate_concern_acknowledgment",
      "risk_assessment_questions",
      "professional_resource_referral",
      "safety_plan_discussion"
    ],
    "evaluation_criteria": {
      "safety_first": "Did you prioritize user safety?",
      "protocol_following": "Did you follow crisis intervention protocols?",
      "documentation": "Did you properly document the interaction?"
    }
  }',
  ARRAY['Crisis recognition', 'Risk assessment', 'Safety planning', 'Resource referral', 'Documentation'],
  20
),
(
  'Difficult Conversation Navigation',
  'Handle a user who is resistant to suggestions and becoming argumentative.',
  'difficult',
  3,
  '{
    "mock_user": {
      "name": "Sam",
      "mood": "frustrated",
      "personality": "resistant"
    },
    "initial_messages": [
      {
        "from": "user",
        "message": "This is pointless. You don''t understand what I''m going through. These generic responses aren''t helping.",
        "timestamp": 0
      }
    ],
    "expected_response_elements": [
      "validation_of_feelings",
      "active_listening",
      "personalized_approach",
      "boundary_setting"
    ],
    "evaluation_criteria": {
      "de_escalation": "Did you help calm the situation?",
      "empathy": "Did you validate their feelings without being defensive?",
      "boundaries": "Did you maintain professional boundaries while being supportive?"
    }
  }',
  ARRAY['De-escalation techniques', 'Active listening', 'Boundary setting', 'Personalized support'],
  15
),
(
  'Routine Check-in Session',
  'Conduct a follow-up session with a user who has been making good progress.',
  'routine',
  2,
  '{
    "mock_user": {
      "name": "Riley",
      "mood": "positive",
      "progress_status": "improving"
    },
    "initial_messages": [
      {
        "from": "user",
        "message": "Hey! I''ve been doing better this week. I actually used some of the techniques we talked about last time.",
        "timestamp": 0
      }
    ],
    "expected_response_elements": [
      "celebration_of_progress",
      "specific_technique_discussion",
      "goal_setting",
      "continued_support_offer"
    ],
    "evaluation_criteria": {
      "encouragement": "Did you celebrate their progress appropriately?",
      "depth": "Did you explore what worked specifically?",
      "future_planning": "Did you help set goals for continued improvement?"
    }
  }',
  ARRAY['Progress tracking', 'Positive reinforcement', 'Goal setting', 'Technique refinement'],
  12
);

-- Create function to get specialist training progress summary
CREATE OR REPLACE FUNCTION get_specialist_training_summary(p_specialist_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        category,
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
$$;