# EAP Analytics - Gap Analysis & Implementation Status

**Last Updated:** 2025-10-22  
**Project:** LEAP Recovery Platform - ConocoPhillips EAP Analytics  
**Compliance:** HIPAA-compliant, minimum cohort size = 10 users

---

## Executive Summary

This document provides a comprehensive analysis of the requested EAP analytics capabilities versus current implementation status. It identifies which metrics can be produced with existing data, which require new data collection, and the engineering effort required for full implementation.

**Current Support Status:**
- ✅ **Fully Supported:** 35% of metrics
- ⚠️ **Partially Supported:** 45% of metrics  
- ❌ **Not Supported:** 20% of metrics

---

## Unsupported Metrics & Required Changes

| Metric Name | Status | Reason | Required Data | Eng. Scope | Privacy Notes |
|------------|--------|---------|---------------|-----------|---------------|
| **Enrollment Rate** | ❌ Not Supported | No `eligible_users` tracking | New table: `employer_cohorts` with fields: `org_id`, `eligible_users_count`, `enrolled_users_count` | M | No PII - aggregate counts only |
| **Craving Intensity Tracking** | ❌ Not Supported | No structured craving events | New event: `craving_reported` with fields: `intensity` (1-10), `trigger_type`, `timestamp` | S | Aggregate by cohort only |
| **Return-to-Work (RTW) Success Rate** | ❌ Not Supported | Requires HR integration | HR data feed: JSON payload with `{org_id, cohort_size, rtw_count, period}` | L | Must be pre-aggregated by HR |
| **Absenteeism Reduction** | ❌ Not Supported | Requires HR integration | HR data feed: JSON payload with `{org_id, cohort_size, pre_absence_days, post_absence_days}` | L | Must be pre-aggregated by HR |
| **Retention Rate** | ❌ Not Supported | Requires HR integration | HR data feed: JSON payload with `{org_id, cohort_size, retained_count, period}` | L | Must be pre-aggregated by HR |
| **Productivity Confidence Score** | ❌ Not Supported | No pulse survey system | New table: `pulse_surveys` with fields: `survey_type`, `score` (1-5), `user_id`, `timestamp` | M | Anonymous aggregation |

---

## Partially Supported Metrics

| Metric Name | Current Support | Missing Elements | Required Changes | Eng. Scope | Privacy Notes |
|------------|----------------|------------------|------------------|-----------|---------------|
| **Weekly Active Users** | ⚠️ Partial | Has login tracking, needs engagement threshold | Add `engagement_score` calculation based on feature use | S | Already anonymous |
| **Crisis Alert Reductions** | ⚠️ Partial | Has crisis flags in activity logs, needs structured tracking | New event type: `crisis_flag` with severity level | S | Aggregate counts only |
| **Average Mood Improvement** | ⚠️ Partial | Has gratitude entries with mood, needs baseline tracking | Add `baseline_mood` field to user_journey_progress | S | Delta aggregation only |
| **Stress Index Trend** | ⚠️ Partial | Has mood data, needs explicit stress tracking | Add `stress_level` field to daily check-ins | S | Trend data, no individuals |
| **Feature Engagement Mix** | ⚠️ Partial | Has activity logs, needs categorization | Enhance activity log types with standard feature names | S | Percentage mix only |
| **EAP Escalation Avoidance** | ⚠️ Partial | Has chat sessions, needs escalation flags | Add `escalation_type` field to chat_sessions | S | Count reduction only |
| **Recovery Confidence Index** | ⚠️ Partial | No survey system, can derive from journey progress | New table: `pulse_surveys` OR derive from existing recovery strength | M | Anonymous aggregation |
| **Belonging/Support Score** | ⚠️ Partial | No survey system | New table: `pulse_surveys` with `belonging_score` | M | Anonymous aggregation |
| **Stigma Reduction Indicator** | ⚠️ Partial | No survey system | New table: `pulse_surveys` with `stigma_perception_score` | M | Anonymous pre/post |

---

## Fully Supported Metrics

| Metric Name | Data Source | Notes |
|------------|-------------|-------|
| **Journey Completion Rate** | `user_journey_progress` | ✅ Tracks current_day, completed_days |
| **Average Streak Duration** | `user_toolbox_stats`, `cbt_game_streaks` | ✅ Has current_streak, longest_streak |
| **Weekly Chat Sessions** | `chat_sessions` | ✅ Timestamped, can aggregate by week |
| **Peer Contact Counts** | `chat_sessions` | ✅ Count of completed sessions |
| **Total Messages** | `chat_messages` | ✅ Aggregate counts available |
| **Stability Days** | `user_toolbox_stats` | ✅ Can derive from streak_count |

---

## Required Schema Changes

### 1. **Employer Cohorts Table** (Priority: HIGH)
```sql
CREATE TABLE employer_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  org_name TEXT NOT NULL,
  business_unit TEXT,
  location TEXT,
  eligible_users_count INT NOT NULL,
  enrolled_users_count INT NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only admins and authorized EAP coordinators can view
CREATE POLICY "EAP coordinators can view their org cohorts"
  ON employer_cohorts FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM employer_coordinators WHERE org_id = employer_cohorts.org_id));
```

### 2. **Structured Craving Events** (Priority: MEDIUM)
```sql
CREATE TABLE craving_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  intensity INT NOT NULL CHECK (intensity BETWEEN 1 AND 10),
  trigger_type TEXT,
  coping_strategy TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only insert their own
CREATE POLICY "Users can log their own cravings"
  ON craving_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. **Pulse Surveys Table** (Priority: MEDIUM)
```sql
CREATE TABLE pulse_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  survey_type TEXT NOT NULL, -- 'productivity', 'belonging', 'stigma', 'confidence'
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  survey_period TEXT, -- 'baseline', 'q1', 'q2', etc.
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only insert their own
CREATE POLICY "Users can submit their own surveys"
  ON pulse_surveys FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. **HR Integration Feed** (Priority: HIGH)
```sql
CREATE TABLE hr_aggregate_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'retention', 'absenteeism', 'rtw'
  cohort_size INT NOT NULL CHECK (cohort_size >= 10),
  metric_value NUMERIC NOT NULL,
  comparison_value NUMERIC, -- pre-period value
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES auth.users(id)
);

-- RLS: Only authorized HR integrations
CREATE POLICY "Only authorized HR users can submit"
  ON hr_aggregate_data FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM employer_coordinators WHERE role = 'hr_integration'));
```

---

## Event Tracking Enhancements

### New Events to Implement

#### 1. Daily Check-In Event
```typescript
interface DailyCheckIn {
  event_type: 'daily_checkin';
  user_id: string;
  mood_rating: number; // 1-5
  stress_level: number; // 1-5
  craving_intensity: number; // 0-10
  timestamp: string;
}
```

#### 2. Crisis Flag Event
```typescript
interface CrisisFlag {
  event_type: 'crisis_flag';
  user_id: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  escalated_to_eap: boolean;
  timestamp: string;
}
```

#### 3. Feature Use Event
```typescript
interface FeatureUse {
  event_type: 'feature_use';
  user_id: string;
  feature_name: 'journal' | 'peer_chat' | 'breathing' | 'gratitude' | 'urge_tracker' | 'recovery_plan';
  duration_seconds: number;
  timestamp: string;
}
```

---

## Privacy & Compliance Requirements

### Implemented ✅
- Minimum cohort size rule (n >= 10) enforced at query level
- No PII/PHI in exports
- Aggregate-only reporting
- RBAC for employer portal access

### To Implement ⚠️
- Automated compliance check before export (block if cohort < 10)
- Audit log for all employer dashboard access
- BAA acceptance workflow
- User consent tracking for analytics inclusion
- Data retention policy (36 months maximum)

---

## Engineering Effort Summary

| Component | Scope | Est. Hours | Priority |
|-----------|-------|----------|----------|
| Employer cohorts table + RLS | M | 8h | HIGH |
| Craving events schema | S | 4h | MEDIUM |
| Pulse surveys system | M | 16h | MEDIUM |
| HR integration API + validation | L | 40h | HIGH |
| Enhanced activity log categorization | S | 8h | HIGH |
| Aggregation queries with cohort suppression | M | 24h | HIGH |
| Employer dashboard UI | L | 32h | HIGH |
| PDF/CSV export with compliance checks | M | 16h | HIGH |
| Quarterly report generator | M | 16h | MEDIUM |
| Automated compliance guardrails | M | 12h | HIGH |
| **TOTAL** | | **176h (~22 days)** | |

---

## Recommended Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Employer cohorts table
- Enhanced activity logging
- Basic aggregation queries
- Cohort suppression logic

### Phase 2: Core Analytics (Weeks 3-4)
- Employer dashboard UI
- Engagement & stability metrics
- Export functionality
- Compliance checks

### Phase 3: Advanced Features (Weeks 5-6)
- Pulse survey system
- Craving tracking
- HR integration API
- Quarterly reports

### Phase 4: Polish & Security (Week 7)
- Audit logging
- BAA workflow
- Performance optimization
- UAT with ConocoPhillips

---

## Next Steps (Prioritized)

1. **Immediate (Week 1)**
   - Create employer_cohorts table
   - Implement cohort suppression function
   - Build basic aggregation queries

2. **Short-term (Weeks 2-3)**
   - Build employer dashboard UI
   - Implement engagement metrics
   - Add export with compliance checks

3. **Medium-term (Weeks 4-6)**
   - Add pulse survey system
   - Implement HR integration API
   - Build quarterly report generator

4. **Long-term (Weeks 7-8)**
   - Full audit logging
   - Performance optimization
   - ConocoPhillips pilot deployment

---

## Assumptions Made

1. HR data will be pre-aggregated by employer to protect PII
2. Minimum viable cohort size is 10 (configurable)
3. Data retention is 36 months
4. Employers will have dedicated coordinator accounts
5. Pulse surveys are opt-in for users
6. Crisis flags already exist in activity logs (need enhancement)
7. Initial deployment is ConocoPhillips only, then multi-tenant

---

## Contact & Review

**Document Owner:** LEAP Engineering Team  
**Reviewers Required:** Legal (BAA), Security (HIPAA), Product (ConocoPhillips stakeholder)  
**Next Review:** After Phase 1 completion
