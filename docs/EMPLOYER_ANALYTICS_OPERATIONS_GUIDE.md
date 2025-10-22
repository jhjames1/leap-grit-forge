# Employer Analytics Operations Guide

**Version:** 1.0  
**Last Updated:** 2025-10-22  
**For:** LEAP Platform - ConocoPhillips EAP Analytics

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow Architecture](#data-flow-architecture)
3. [Privacy & Compliance Controls](#privacy--compliance-controls)
4. [Cohort Suppression Logic](#cohort-suppression-logic)
5. [HR Data Integration](#hr-data-integration)
6. [Query Examples](#query-examples)
7. [Monitoring & Audit](#monitoring--audit)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Employer Analytics system provides HIPAA-compliant, anonymized insights for enterprise employers (e.g., ConocoPhillips) to demonstrate the effectiveness of the LEAP recovery platform in supporting employee wellbeing and retention.

**Key Principles:**
- **No PII/PHI exposure**: All data is aggregated and anonymized
- **Minimum cohort size**: n ≥ 10 users required for any metric display
- **Aggregate-only**: Never show individual user data, timestamps, or content
- **Role-based access**: Employers can only see their own cohort data
- **Audit trail**: All access is logged for compliance

---

## Data Flow Architecture

```
┌─────────────────┐
│  User Events    │
│  (App Activity) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Storage  │
│  (Supabase)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Aggregation    │
│  Service        │
│  (Cohort n≥10)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analytics API  │
│  (Read-Only)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard UI   │
│  (Employer)     │
└─────────────────┘
```

### Components

1. **Event Tracking**: User activities logged to `user_activity_logs`, `chat_sessions`, `user_journey_progress`, etc.
2. **Aggregation Service**: `employerAnalyticsService.ts` computes metrics with cohort suppression
3. **API Layer**: Read-only endpoints enforce RBAC and compliance checks
4. **Dashboard**: React UI displaying anonymized metrics with export capabilities

---

## Privacy & Compliance Controls

### HIPAA Compliance Measures

1. **Minimum Cohort Size (n ≥ 10)**
   - All queries check cohort size before returning data
   - If cohort < 10, entire dataset is suppressed (returns null)
   - No exceptions - hard-coded minimum in `MIN_COHORT_SIZE` constant

2. **Data Minimization**
   - Only aggregate statistics are computed
   - No user IDs, names, emails, or timestamps exposed to employer
   - Raw data never leaves Supabase backend

3. **Access Control**
   - Row-Level Security (RLS) policies restrict data by org_id
   - Employer coordinators can only query their own organization
   - Admin access logged and audited

4. **Encryption**
   - All data encrypted at rest (Supabase default)
   - TLS 1.3 for data in transit
   - API keys rotated quarterly

5. **Audit Logging**
   - Every analytics query logged with user_id, org_id, timestamp
   - Export actions logged separately
   - Logs retained for 7 years per compliance requirements

### BAA (Business Associate Agreement)

- BAA must be signed before analytics access is granted
- BAA acceptance tracked in `employer_coordinators` table
- UI enforces BAA acknowledgment before first export

---

## Cohort Suppression Logic

### Implementation

The cohort suppression is enforced at multiple layers:

#### 1. Service Layer (`employerAnalyticsService.ts`)
```typescript
async getAnalyticsSummary(query: EmployerAnalyticsQuery): Promise<EmployerAnalyticsSummary | null> {
  const cohort = await this.getCohortInfo(query.orgId, startDate, endDate);
  
  // CRITICAL: Suppress entire dataset if below threshold
  if (!cohort || cohort.cohortSize < MIN_COHORT_SIZE) {
    logger.warn(`Cohort size below minimum for org ${query.orgId}: ${cohort?.cohortSize || 0}`);
    return null; // No data returned
  }
  
  // Proceed with calculations...
}
```

#### 2. Query Level (SQL Functions - to be implemented)
```sql
CREATE OR REPLACE FUNCTION check_cohort_size(p_org_id TEXT, p_start_date DATE, p_end_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cohort_count INT;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO cohort_count
  FROM profiles
  WHERE metadata->>'org_id' = p_org_id
    AND created_at BETWEEN p_start_date AND p_end_date;
  
  RETURN cohort_count >= 10;
END;
$$;
```

#### 3. Export Validation
Before any CSV/PDF export:
```typescript
if (cohortSize < MIN_COHORT_SIZE) {
  throw new Error('Export blocked: cohort size below minimum threshold');
}
```

### Edge Cases

- **Cohort size exactly 10**: Allowed (meets minimum)
- **Cohort size 9**: Entire dataset suppressed
- **Cohort splits by location**: Each sub-cohort must independently meet n ≥ 10
- **Time-series data**: Cohort size checked for each time period

---

## HR Data Integration

### Overview

HR metrics (retention, absenteeism, RTW) require data from employer's HR system. To protect individual privacy, **HR data MUST be pre-aggregated before submission**.

### Required Data Format

HR system submits JSON payload via secure API:

```json
{
  "org_id": "conocophillips",
  "submission_date": "2024-10-22",
  "period_start": "2024-07-01",
  "period_end": "2024-09-30",
  "metrics": {
    "retention": {
      "cohort_size": 45,
      "retained_count": 42,
      "retention_rate": 93.3
    },
    "absenteeism": {
      "cohort_size": 45,
      "pre_avg_absence_days": 8.2,
      "post_avg_absence_days": 3.1,
      "reduction_pct": 62.2
    },
    "return_to_work": {
      "cohort_size": 12,
      "successful_rtw_count": 11,
      "success_rate": 91.7
    }
  }
}
```

### Validation Rules

1. **Cohort size check**: Each metric's cohort_size must be ≥ 10
2. **Data consistency**: period_start/end must align with reporting quarters
3. **Authorization**: Only authorized HR coordinators can submit
4. **Audit trail**: All submissions logged

### API Endpoint (to be implemented)

```
POST /api/employer/:orgId/hr-metrics
Authorization: Bearer <hr_coordinator_token>
Content-Type: application/json

{
  // JSON payload as above
}
```

### Storage

HR data stored in `hr_aggregate_data` table (see Gap Analysis for schema).

---

## Query Examples

### 1. Get Analytics Summary
```typescript
import { employerAnalyticsService } from '@/services/employerAnalyticsService';

const query: EmployerAnalyticsQuery = {
  orgId: 'conocophillips',
  range: 'this_quarter'
};

const summary = await employerAnalyticsService.getAnalyticsSummary(query);

if (!summary) {
  console.log('Cohort size below minimum - data suppressed');
} else {
  console.log(`Cohort size: ${summary.cohortSize}`);
  console.log(`Weekly active users: ${summary.engagement.weeklyActiveUsers}%`);
}
```

### 2. Export Quarterly Report
```typescript
// Check cohort size first
if (summary && summary.cohortSize >= MIN_COHORT_SIZE) {
  await generateQuarterlyReport(summary); // PDF generation
} else {
  throw new Error('Export blocked due to insufficient cohort size');
}
```

### 3. Cohort-Specific Query (SQL - example)
```sql
-- Get weekly active users for org cohort
SELECT 
  COUNT(DISTINCT user_id) AS active_users,
  (COUNT(DISTINCT user_id) * 100.0 / :total_cohort_size) AS active_percentage
FROM user_activity_logs
WHERE timestamp >= :start_date 
  AND timestamp <= :end_date
  AND user_id IN (
    SELECT user_id FROM profiles 
    WHERE metadata->>'org_id' = :org_id
  )
HAVING COUNT(DISTINCT user_id) >= 10; -- Cohort suppression
```

---

## Monitoring & Audit

### Metrics to Monitor

1. **Query Performance**
   - Average query response time
   - 95th percentile latency
   - Failed query rate

2. **Cohort Health**
   - Number of suppressed queries (cohort < 10)
   - Average cohort sizes by org
   - Cohort growth trends

3. **Access Patterns**
   - Dashboard logins per org
   - Export frequency
   - API call volume

### Audit Log Fields

Every analytics query logs:
- `user_id`: Who accessed the data
- `org_id`: Which organization's data
- `query_type`: summary | engagement | wellbeing | roi | culture
- `cohort_size`: Size of cohort queried
- `suppressed`: Boolean - was data suppressed?
- `timestamp`: When query occurred
- `ip_address`: Source IP
- `export_action`: null | 'pdf' | 'csv'

### Alerts

Set up alerts for:
- Repeated access to suppressed cohorts (potential privacy breach attempt)
- Unusual export volumes
- Failed BAA validations
- Cohort size dropping below threshold

---

## Troubleshooting

### "Cohort size below minimum" Error

**Symptom**: Dashboard shows "Insufficient data" message  
**Cause**: Fewer than 10 users in the organization's cohort  
**Solution**:
1. Verify org_id is correct
2. Check if users have metadata.org_id set properly
3. Confirm date range includes enough users
4. If intentional, no action needed - this is correct privacy behavior

### HR Metrics Not Showing

**Symptom**: ROI tab shows "HR data integration required"  
**Cause**: No HR data submitted for the period  
**Solution**:
1. Verify HR integration is set up
2. Check `hr_aggregate_data` table for submissions
3. Ensure submitted data meets date range and cohort size requirements
4. Contact HR coordinator to submit data

### Export Blocked

**Symptom**: "Export blocked due to compliance check"  
**Cause**: Cohort size dropped below 10 or BAA not acknowledged  
**Solution**:
1. Verify cohort size in current query
2. Check BAA acceptance status in `employer_coordinators` table
3. Ensure user has correct permissions

### Slow Dashboard Loading

**Symptom**: Dashboard takes >5 seconds to load  
**Cause**: Large cohort or inefficient queries  
**Solution**:
1. Check query execution plans in Supabase dashboard
2. Add indexes on commonly queried fields (user_id, timestamp, org_id)
3. Consider implementing materialized views for large cohorts
4. Cache results with 1-hour TTL

---

## Security Checklist

Before deploying to production:

- [ ] RLS policies enabled on all employer tables
- [ ] Minimum cohort size enforced at service and query levels
- [ ] Export validation includes cohort size check
- [ ] BAA workflow implemented and tested
- [ ] Audit logging enabled for all analytics queries
- [ ] API rate limiting configured
- [ ] TLS 1.3 enforced on all endpoints
- [ ] User consent tracking implemented
- [ ] Data retention policy configured (36 months)
- [ ] Penetration testing completed
- [ ] Legal review of privacy controls
- [ ] ConocoPhillips security audit passed

---

## Support Contacts

**Technical Issues**: LEAP Engineering Team  
**Privacy/Compliance Questions**: LEAP Legal/Compliance Team  
**HR Integration**: ConocoPhillips EAP Coordinator  
**Emergency Security**: security@leap-platform.com
