

# Complete LEAP PWA Documentation (Including Code Documentation)

## Overview

This plan expands the documentation system to include both **user-facing documentation** AND **code/technical documentation** in a single downloadable file. This will be a comprehensive reference covering everything from how to use the app to how the code is structured.

## Documentation Structure

The downloadable PDF/HTML will contain these major sections:

---

### Part 1: User Guide
For everyday app users:
- Getting Started & Onboarding
- Dashboard Overview
- Recovery Journey (90-day program)
- Toolbox Features (Breathing, Urge Tracker, Gratitude, Triggers, etc.)
- The Foreman AI Coach
- Peer Chat Support
- Profile & Settings
- PWA Installation

---

### Part 2: Peer Specialist Training Manual
For peer support specialists:
- Portal Access & Authentication
- Dashboard Navigation
- Chat Session Management
- Calendar & Scheduling
- Communication Tools
- Performance Metrics
- Training Modules

---

### Part 3: Admin/Employer Portal Guide
For administrators:
- User Management
- Specialist Management
- Analytics Dashboard
- Content Management

---

### Part 4: Code Documentation (NEW)

#### 4.1 Architecture Overview
- Technology stack (React, Vite, TypeScript, Tailwind, Supabase)
- Project folder structure
- Data flow diagram
- Authentication flow

#### 4.2 Hooks Reference
Documentation for all 30+ custom hooks:

| Hook | Purpose |
|------|---------|
| `useAuth` | User authentication state |
| `useUserData` | User profile and progress data |
| `useBadgeNotifications` | Badge earned celebrations |
| `useRecoveryStrength` | Recovery streak calculations |
| `useSpecialistSessions` | Chat session management |
| `useSpecialistCalendar` | Appointment scheduling |
| `useChatOperations` | Real-time messaging |
| `useRealtimeSpecialistStatus` | Presence broadcasting |
| ... and more |

#### 4.3 Services Reference
Documentation for all services:

| Service | Purpose |
|---------|---------|
| `adminAnalyticsService` | Admin dashboard metrics |
| `employerAnalyticsService` | Employer portal analytics |
| `notificationService` | Push notification delivery |
| `realtimeService` | WebSocket subscriptions |
| `supabaseUserService` | User CRUD operations |

#### 4.4 Utilities Reference
Documentation for all utility modules:

| Utility | Purpose |
|---------|---------|
| `trackingManager` | Activity logging and stats |
| `secureStorage` | Encrypted local storage |
| `security` | Password validation, sanitization |
| `badgeUtils` | Badge calculation logic |
| `recoveryStrength` | Streak algorithms |
| `pdfGenerator` | Recovery plan PDFs |
| `calendarAvailability` | Schedule management |

#### 4.5 Edge Functions (API Endpoints)
Documentation for all 20+ Supabase Edge Functions:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `foreman-chat` | POST | AI coach responses |
| `create-appointments` | POST | Schedule appointments |
| `create-recurring-appointments` | POST | Recurring schedule |
| `send-specialist-invitation` | POST | Invite specialists |
| `admin-management` | POST | Admin operations |
| `user-management` | POST | User CRUD |
| `compute-peer-metrics` | POST | Performance stats |
| ... and more |

#### 4.6 Database Schema
- Tables and relationships
- Row Level Security (RLS) policies
- Key indexes
- Data flow between tables

#### 4.7 Component Architecture
- Page components (`/pages`)
- Feature components (`/components`)
- UI components (`/components/ui`)
- Context providers

---

### Part 5: Existing Technical Documents (Included)
- Security Implementation Guide (from `docs/security-implementation.md`)
- EAP Analytics Gap Analysis (from `docs/EAP_ANALYTICS_GAP_ANALYSIS.md`)
- Employer Analytics Operations Guide (from `docs/EMPLOYER_ANALYTICS_OPERATIONS_GUIDE.md`)
- Specialist Portal Flow (from `docs/specialist-portal-flow.md`)

---

### Part 6: Appendices
- Glossary of terms
- Troubleshooting guide
- Browser compatibility
- Environment variables
- Deployment checklist

---

## Implementation Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Documentation.tsx` | Documentation viewer page with download button |
| `src/utils/completeDocumentationGenerator.ts` | Generates full documentation content |
| `src/data/codeDocumentation.ts` | Code documentation data (hooks, services, APIs) |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/documentation` route |
| `src/components/UserProfile.tsx` | Add "Download Manual" link |

### Download Approach
- Use browser's `window.print()` with print-optimized CSS
- Alternative: Generate HTML file for offline viewing
- Professional formatting with table of contents
- Estimated length: 80-120 pages

### Code Documentation Generation
The generator will:
1. Read existing docs from `/docs` folder
2. Include pre-written hook/service/utility descriptions
3. Pull edge function names and purposes
4. Format everything in a consistent, readable style
5. Add version number and generation timestamp

---

## Technical Notes

- All documentation generated client-side (no server required)
- Works offline after first load
- Print-friendly styling with page breaks
- Includes diagrams using ASCII art for compatibility
- Mobile-responsive documentation viewer

