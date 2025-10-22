/**
 * EAP/Employer Analytics Type Definitions
 * HIPAA-compliant, anonymized analytics for enterprise employers
 */

export interface EmployerCohort {
  org_id: string;
  org_name: string;
  business_unit?: string;
  location?: string;
  eligible_users_count: number;
  enrolled_users_count: number;
  period_start: string;
  period_end?: string;
}

export interface EngagementMetrics {
  enrollmentRate: number; // activated_users / eligible_users
  weeklyActiveUsers: number; // % of activated users active in week
  avgStreakDuration: number; // days
  journeyCompletionRate: number; // % completing foundation phase
  featureEngagementMix: {
    journaling: number;
    peerChat: number;
    reflections: number;
    breathingExercises: number;
    urgeTracker: number;
    recoveryPlan: number;
  };
}

export interface WellbeingMetrics {
  avgMoodImprovement: number; // Δ mood score over period
  stressIndexTrend: number; // avg stress score, % change
  cravingFrequencyIndex: number; // cravings per user-week
  cravingFrequencyChange: number; // % change from prior period
  crisisAlertReductions: number; // % reduction in crisis flags
  stabilityDays: number; // avg consecutive stable days
}

export interface ROIMetrics {
  retentionRate?: number; // % retained (from HR feed)
  absenteeismReduction?: number; // % reduction (from HR feed)
  returnToWorkSuccessRate?: number; // % successful RTW (from HR feed)
  eapEscalationAvoidance: number; // % reduction in EAP escalations
  productivityConfidenceScore?: number; // 1-5 from pulse survey
}

export interface CultureMetrics {
  recoveryConfidenceIndex?: number; // 1-5 from pulse survey
  belongingSupportScore?: number; // 1-5 from pulse survey
  stigmaReductionIndicator?: number; // Δ stigma perception score
  sentimentRollup?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface EmployerAnalyticsSummary {
  orgId: string;
  orgName: string;
  periodStart: string;
  periodEnd: string;
  cohortSize: number; // MUST be >= 10 or data is suppressed
  engagement: EngagementMetrics;
  wellbeing: WellbeingMetrics;
  roi: ROIMetrics;
  culture: CultureMetrics;
  insightSnapshots: string[]; // Auto-generated bullet points
  complianceNotes: {
    cohortSizeMet: boolean;
    dataRedacted: boolean;
    baaAcknowledged: boolean;
  };
}

export interface TrendData {
  period: string; // 'Q1 2024', 'Week 23', etc.
  value: number;
  change?: number; // % change from previous period
}

export interface EmployerDashboardData {
  summary: EmployerAnalyticsSummary;
  weeklyTrend: TrendData[];
  quarterlyTrend: TrendData[];
  cohortBreakdown?: {
    byBusinessUnit: Record<string, number>;
    byLocation: Record<string, number>;
  };
}

// Analytics query parameters
export interface EmployerAnalyticsQuery {
  orgId: string;
  range: 'this_quarter' | 'last_quarter' | 'rolling_90' | 'custom';
  startDate?: string;
  endDate?: string;
  businessUnit?: string;
  location?: string;
}

// Compliance and privacy
export const MIN_COHORT_SIZE = 10;

export function isCohortValid(cohortSize: number): boolean {
  return cohortSize >= MIN_COHORT_SIZE;
}

export function suppressIfBelowThreshold<T>(
  data: T,
  cohortSize: number,
  redactedValue: T
): T {
  return isCohortValid(cohortSize) ? data : redactedValue;
}

// Event definitions for tracking
export interface DailyCheckInEvent {
  user_id: string;
  mood_rating: number; // 1-5
  stress_level: number; // 1-5
  craving_intensity: number; // 0-10
  timestamp: string;
}

export interface CrisisEvent {
  user_id: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  escalated_to_eap: boolean;
  timestamp: string;
}

export interface FeatureUseEvent {
  user_id: string;
  feature_name: 'journal' | 'peer_chat' | 'breathing' | 'gratitude' | 'urge_tracker' | 'recovery_plan';
  duration_seconds: number;
  timestamp: string;
}

export interface PulseSurvey {
  user_id: string;
  survey_type: 'productivity' | 'belonging' | 'stigma' | 'confidence';
  score: number; // 1-5
  survey_period: string; // 'baseline', 'q1', 'q2', etc.
  submitted_at: string;
}
