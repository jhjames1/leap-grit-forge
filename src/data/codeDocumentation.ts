// Complete Code Documentation Data for LEAP PWA

export interface HookDocumentation {
  name: string;
  purpose: string;
  file: string;
  params?: string;
  returns?: string;
  usage?: string;
}

export interface ServiceDocumentation {
  name: string;
  purpose: string;
  file: string;
  methods?: string[];
}

export interface UtilityDocumentation {
  name: string;
  purpose: string;
  file: string;
  functions?: string[];
}

export interface EdgeFunctionDocumentation {
  name: string;
  method: string;
  purpose: string;
  auth: string;
  params?: string;
}

export interface ComponentDocumentation {
  name: string;
  purpose: string;
  category: string;
}

export interface DatabaseTableDocumentation {
  name: string;
  purpose: string;
  keyColumns?: string[];
  relationships?: string[];
}

// ============================================
// HOOKS DOCUMENTATION
// ============================================
export const hooksDocumentation: HookDocumentation[] = [
  // Authentication & User
  {
    name: 'useAuth',
    purpose: 'Manages user authentication state including sign-in, sign-out, session management, and new user detection for onboarding flows.',
    file: 'src/hooks/useAuth.ts',
    returns: '{ user, loading, signOut, isAuthenticated, isNewSignUp }'
  },
  {
    name: 'useAuthRecovery',
    purpose: 'Handles authentication recovery scenarios like password reset and email confirmation flows.',
    file: 'src/hooks/useAuthRecovery.ts'
  },
  {
    name: 'useUserData',
    purpose: 'Centralized hook for user profile data, journey progress, toolbox stats, and activity logging. Single source of truth for user state.',
    file: 'src/hooks/useUserData.ts',
    returns: '{ userData, updateUserData, markDayComplete, loading }'
  },

  // Chat & Messaging
  {
    name: 'useChatMessages',
    purpose: 'Manages chat message state, fetching, and sending for both user and specialist chat interfaces.',
    file: 'src/hooks/chat/useChatMessages.ts'
  },
  {
    name: 'useChatRealtime',
    purpose: 'Handles real-time message subscriptions using Supabase Realtime for live chat updates.',
    file: 'src/hooks/chat/useChatRealtime.ts'
  },
  {
    name: 'useUserChat',
    purpose: 'User-side chat hook for connecting with peer specialists, managing session state, and sending messages.',
    file: 'src/hooks/chat/useUserChat.ts'
  },
  {
    name: 'useSpecialistChat',
    purpose: 'Specialist-side chat hook for managing multiple user sessions, accepting chats, and responding to users.',
    file: 'src/hooks/chat/useSpecialistChat.ts'
  },
  {
    name: 'useChatOperations',
    purpose: 'Low-level chat operations including message CRUD, session management, and error handling.',
    file: 'src/hooks/useChatOperations.ts'
  },

  // Specialist Management
  {
    name: 'usePeerSpecialists',
    purpose: 'Fetches and manages list of available peer specialists for user selection.',
    file: 'src/hooks/usePeerSpecialists.ts'
  },
  {
    name: 'useSpecialistSessions',
    purpose: 'Manages specialist chat sessions including waiting, active, and archived sessions.',
    file: 'src/hooks/useSpecialistSessions.ts'
  },
  {
    name: 'useSpecialistPresence',
    purpose: 'Broadcasts and tracks specialist online/offline/busy status for real-time availability.',
    file: 'src/hooks/useSpecialistPresence.ts'
  },
  {
    name: 'useSpecialistStatus',
    purpose: 'Manages specialist status updates and persistence to database.',
    file: 'src/hooks/useSpecialistStatus.ts'
  },
  {
    name: 'useSpecialistStatusScheduler',
    purpose: 'Automatically updates specialist status based on calendar schedules.',
    file: 'src/hooks/useSpecialistStatusScheduler.ts'
  },
  {
    name: 'useRealtimeSpecialistStatus',
    purpose: 'Subscribes to real-time specialist status changes across the platform.',
    file: 'src/hooks/useRealtimeSpecialistStatus.ts'
  },
  {
    name: 'useSpecialistCalendar',
    purpose: 'Manages specialist calendar, appointments, availability slots, and scheduling.',
    file: 'src/hooks/useSpecialistCalendar.ts'
  },
  {
    name: 'useSpecialistMetrics',
    purpose: 'Fetches and calculates specialist performance metrics and statistics.',
    file: 'src/hooks/useSpecialistMetrics.ts'
  },
  {
    name: 'useSpecialistAnalytics',
    purpose: 'Advanced analytics for specialist performance dashboards.',
    file: 'src/hooks/useSpecialistAnalytics.ts'
  },
  {
    name: 'useCalendarAwarePresence',
    purpose: 'Combines calendar schedule with presence to show accurate specialist availability.',
    file: 'src/hooks/useCalendarAwarePresence.ts'
  },

  // Recovery & Progress
  {
    name: 'useRecoveryStrength',
    purpose: 'Calculates recovery strength score based on streak, tool usage, and engagement patterns.',
    file: 'src/hooks/useRecoveryStrength.ts'
  },
  {
    name: 'useAIJourney',
    purpose: 'Manages AI-generated personalized recovery journey content and progression.',
    file: 'src/hooks/useAIJourney.ts'
  },
  {
    name: 'useBadgeNotifications',
    purpose: 'Tracks earned badges and triggers celebration modals for new achievements.',
    file: 'src/hooks/useBadgeNotifications.ts'
  },
  {
    name: 'useModuleProgress',
    purpose: 'Tracks completion progress through training modules for specialists.',
    file: 'src/hooks/useModuleProgress.ts'
  },

  // Notifications & Audio
  {
    name: 'useNotifications',
    purpose: 'Fetches and manages user notifications from database with real-time updates.',
    file: 'src/hooks/useNotifications.ts'
  },
  {
    name: 'useAudioNotifications',
    purpose: 'Manages audio notification settings and playback preferences.',
    file: 'src/hooks/useAudioNotifications.ts'
  },
  {
    name: 'useProposalNotifications',
    purpose: 'Handles notifications for appointment proposals and scheduling updates.',
    file: 'src/hooks/useProposalNotifications.ts'
  },
  {
    name: 'usePhoneCallRequests',
    purpose: 'Manages phone call request workflow between users and specialists.',
    file: 'src/hooks/usePhoneCallRequests.ts'
  },

  // Content & Data
  {
    name: 'useMotivationalContent',
    purpose: 'Fetches motivational content (quotes, tips, videos) for display in the app.',
    file: 'src/hooks/useMotivationalContent.ts'
  },
  {
    name: 'useManualContent',
    purpose: 'Fetches specialist manual content from database for training sections.',
    file: 'src/hooks/useManualContent.ts'
  },
  {
    name: 'useTrainingScenarios',
    purpose: 'Manages training scenarios for specialist mock chat practice.',
    file: 'src/hooks/useTrainingScenarios.ts'
  },

  // Admin & Analytics
  {
    name: 'useRealtimeAdminAnalytics',
    purpose: 'Real-time admin dashboard analytics with live metric updates.',
    file: 'src/hooks/useRealtimeAdminAnalytics.ts'
  },
  {
    name: 'useRealtimeDomainEngagement',
    purpose: 'Tracks user engagement metrics per domain for employer analytics.',
    file: 'src/hooks/useRealtimeDomainEngagement.ts'
  },

  // Connectivity & PWA
  {
    name: 'useConnectionMonitor',
    purpose: 'Monitors network connectivity status for offline mode handling.',
    file: 'src/hooks/useConnectionMonitor.ts'
  },
  {
    name: 'useConnectionTest',
    purpose: 'Tests connection to Supabase services for health checks.',
    file: 'src/hooks/useConnectionTest.ts'
  },
  {
    name: 'usePWA',
    purpose: 'Manages PWA installation prompts and service worker registration.',
    file: 'src/hooks/usePWA.ts'
  },
  {
    name: 'useAudio',
    purpose: 'Audio playback utility for notification sounds and media.',
    file: 'src/hooks/useAudio.ts'
  },
  {
    name: 'use-mobile',
    purpose: 'Detects mobile viewport for responsive design adaptations.',
    file: 'src/hooks/use-mobile.tsx'
  },
  {
    name: 'use-toast',
    purpose: 'Toast notification hook for displaying temporary messages.',
    file: 'src/hooks/use-toast.ts'
  }
];

// ============================================
// SERVICES DOCUMENTATION
// ============================================
export const servicesDocumentation: ServiceDocumentation[] = [
  {
    name: 'adminAnalyticsService',
    purpose: 'Fetches and aggregates analytics data for admin dashboards including user counts, engagement metrics, and system health.',
    file: 'src/services/adminAnalyticsService.ts',
    methods: ['getOverviewMetrics', 'getUserGrowth', 'getEngagementStats', 'getActiveUsers']
  },
  {
    name: 'employerAnalyticsService',
    purpose: 'Provides employer-specific analytics including employee engagement, feature usage, and sentiment analysis.',
    file: 'src/services/employerAnalyticsService.ts',
    methods: ['getDomainMetrics', 'getEmployeeEngagement', 'getSentimentTrends', 'getFeatureUsage']
  },
  {
    name: 'notificationService',
    purpose: 'Handles push notification delivery, scheduling, and user preference management.',
    file: 'src/services/notificationService.ts',
    methods: ['sendNotification', 'scheduleReminder', 'updatePreferences']
  },
  {
    name: 'pushNotificationService',
    purpose: 'Manages web push notification subscriptions and delivery via service worker.',
    file: 'src/services/pushNotificationService.ts',
    methods: ['subscribe', 'unsubscribe', 'requestPermission']
  },
  {
    name: 'realtimeService',
    purpose: 'Manages Supabase Realtime channel subscriptions for live data updates.',
    file: 'src/services/realtimeService.ts',
    methods: ['subscribe', 'unsubscribe', 'broadcast']
  },
  {
    name: 'realtimeDomainEngagement',
    purpose: 'Tracks and broadcasts domain-level engagement metrics in real-time.',
    file: 'src/services/realtimeDomainEngagement.ts'
  },
  {
    name: 'screenshotService',
    purpose: 'Manages app screenshot storage and retrieval for documentation.',
    file: 'src/services/screenshotService.ts'
  },
  {
    name: 'supabaseUserService',
    purpose: 'User CRUD operations and profile management via Supabase.',
    file: 'src/services/supabaseUserService.ts',
    methods: ['createUser', 'updateUser', 'getUser', 'deleteUser']
  }
];

// ============================================
// UTILITIES DOCUMENTATION
// ============================================
export const utilitiesDocumentation: UtilityDocumentation[] = [
  {
    name: 'trackingManager',
    purpose: 'Centralized activity tracking for user actions, tool usage, and engagement metrics. Persists to localStorage with Supabase sync.',
    file: 'src/utils/trackingManager.ts',
    functions: ['logAction', 'getTodaysStats', 'getStreakData', 'getWeeklyProgress']
  },
  {
    name: 'secureStorage',
    purpose: 'Encrypted localStorage wrapper for sensitive data with AES encryption.',
    file: 'src/utils/secureStorage.ts',
    functions: ['setItem', 'getItem', 'removeItem', 'clear']
  },
  {
    name: 'security',
    purpose: 'Security utilities including password validation, input sanitization, and XSS prevention.',
    file: 'src/utils/security.ts',
    functions: ['validatePassword', 'sanitizeInput', 'hashPassword', 'generateSecureKey']
  },
  {
    name: 'badgeUtils',
    purpose: 'Badge calculation logic based on user achievements, streaks, and milestones.',
    file: 'src/utils/badgeUtils.ts',
    functions: ['getEarnedBadges', 'checkNewBadges', 'getBadgeProgress']
  },
  {
    name: 'recoveryStrength',
    purpose: 'Algorithm for calculating recovery strength score from multiple factors.',
    file: 'src/utils/recoveryStrength.ts',
    functions: ['calculateStrength', 'getStrengthLevel', 'getFactorBreakdown']
  },
  {
    name: 'pdfGenerator',
    purpose: 'Generates downloadable PDF recovery plans using browser print functionality.',
    file: 'src/utils/pdfGenerator.ts',
    functions: ['generateRecoveryPlan', 'formatForPrint']
  },
  {
    name: 'calendarAvailability',
    purpose: 'Calendar availability calculation for specialist scheduling.',
    file: 'src/utils/calendarAvailability.ts',
    functions: ['getAvailableSlots', 'checkConflicts', 'calculateBuffer']
  },
  {
    name: 'journeyManager',
    purpose: 'Manages 90-day recovery journey progression and content delivery.',
    file: 'src/utils/journeyManager.ts',
    functions: ['getCurrentDay', 'getDayContent', 'markComplete']
  },
  {
    name: 'aiJourneyManager',
    purpose: 'AI-generated journey content management and personalization.',
    file: 'src/utils/aiJourneyManager.ts'
  },
  {
    name: 'journeyCalculation',
    purpose: 'Journey progress calculations and milestone tracking.',
    file: 'src/utils/journeyCalculation.ts'
  },
  {
    name: 'audioNotification',
    purpose: 'Audio notification playback with volume control and sound selection.',
    file: 'src/utils/audioNotification.ts',
    functions: ['playTwoToneNotification', 'playSuccess', 'setVolume']
  },
  {
    name: 'notificationManager',
    purpose: 'Notification queue management and delivery scheduling.',
    file: 'src/utils/notificationManager.ts'
  },
  {
    name: 'conversationMemory',
    purpose: 'Stores conversation context for AI Foreman chat continuity.',
    file: 'src/utils/conversationMemory.ts'
  },
  {
    name: 'savedWisdom',
    purpose: 'Manages user-saved quotes and wisdom from Foreman conversations.',
    file: 'src/utils/savedWisdom.ts',
    functions: ['saveWisdom', 'getWisdom', 'removeWisdom']
  },
  {
    name: 'exportUtils',
    purpose: 'Data export utilities for CSV and JSON format downloads.',
    file: 'src/utils/exportUtils.ts',
    functions: ['exportToCSV', 'exportToJSON', 'formatExportData']
  },
  {
    name: 'dataMigration',
    purpose: 'Handles data migration between localStorage and Supabase.',
    file: 'src/utils/dataMigration.ts'
  },
  {
    name: 'sessionCleanup',
    purpose: 'Cleans up expired sessions and stale data.',
    file: 'src/utils/sessionCleanup.ts'
  },
  {
    name: 'sessionStateManager',
    purpose: 'Manages session state persistence across browser sessions.',
    file: 'src/utils/sessionStateManager.ts'
  },
  {
    name: 'timeoutSessionManager',
    purpose: 'Handles session timeout warnings and automatic logout.',
    file: 'src/utils/timeoutSessionManager.ts'
  },
  {
    name: 'edgeFunctionSecurity',
    purpose: 'Security utilities for edge functions including CORS, validation, and rate limiting.',
    file: 'src/utils/edgeFunctionSecurity.ts'
  },
  {
    name: 'performanceEvents',
    purpose: 'Logs specialist performance events for analytics.',
    file: 'src/utils/performanceEvents.ts'
  },
  {
    name: 'performanceGoals',
    purpose: 'Specialist performance goal tracking and achievement calculation.',
    file: 'src/utils/performanceGoals.ts'
  },
  {
    name: 'advancedCoaching',
    purpose: 'Advanced coaching tips generation for specialists.',
    file: 'src/utils/advancedCoaching.ts'
  },
  {
    name: 'testingMode',
    purpose: 'Testing mode utilities for development and QA.',
    file: 'src/utils/testingMode.ts'
  },
  {
    name: 'youtubeUtils',
    purpose: 'YouTube video URL parsing and embedding utilities.',
    file: 'src/utils/youtubeUtils.ts'
  },
  {
    name: 'logger',
    purpose: 'Centralized logging utility with log levels and formatting.',
    file: 'src/utils/logger.ts'
  },
  {
    name: 'adminAnalytics',
    purpose: 'Admin analytics calculation utilities.',
    file: 'src/utils/adminAnalytics.ts'
  }
];

// ============================================
// EDGE FUNCTIONS DOCUMENTATION
// ============================================
export const edgeFunctionsDocumentation: EdgeFunctionDocumentation[] = [
  {
    name: 'foreman-chat',
    method: 'POST',
    purpose: 'AI-powered Foreman coach responses using OpenAI. Maintains conversation context and provides recovery-focused guidance.',
    auth: 'JWT Required',
    params: 'message, conversationHistory, userData'
  },
  {
    name: 'create-appointments',
    method: 'POST',
    purpose: 'Creates single or multiple appointments between users and specialists.',
    auth: 'JWT Required',
    params: 'specialistId, userId, scheduledStart, scheduledEnd, appointmentTypeId'
  },
  {
    name: 'create-recurring-appointments',
    method: 'POST',
    purpose: 'Creates recurring appointment series with specified frequency and duration.',
    auth: 'JWT Required',
    params: 'frequency, occurrences, startDate, startTime, duration'
  },
  {
    name: 'send-specialist-invitation',
    method: 'POST',
    purpose: 'Sends email invitation to new peer specialists with temporary credentials.',
    auth: 'Admin Only',
    params: 'email, firstName, lastName, specialties'
  },
  {
    name: 'admin-management',
    method: 'POST',
    purpose: 'Administrative operations including user role management and system configuration.',
    auth: 'Admin Only',
    params: 'action, targetUserId, data'
  },
  {
    name: 'user-management',
    method: 'POST',
    purpose: 'User CRUD operations and profile management.',
    auth: 'JWT Required',
    params: 'action, userId, userData'
  },
  {
    name: 'compute-peer-metrics',
    method: 'POST',
    purpose: 'Calculates specialist performance metrics including response times, completion rates, and ratings.',
    auth: 'JWT Required',
    params: 'specialistId, dateRange'
  },
  {
    name: 'generate-journey-content',
    method: 'POST',
    purpose: 'AI-generates personalized daily journey content based on user focus areas.',
    auth: 'JWT Required',
    params: 'dayNumber, focusArea, journeyStage'
  },
  {
    name: 'generate-recovery-plan',
    method: 'POST',
    purpose: 'Creates personalized recovery plan PDF content based on user data.',
    auth: 'JWT Required',
    params: 'userData, focusAreas, completedDays'
  },
  {
    name: 'send-push-notification',
    method: 'POST',
    purpose: 'Sends web push notifications to subscribed users.',
    auth: 'System/JWT',
    params: 'userId, title, body, data'
  },
  {
    name: 'invite-admin',
    method: 'POST',
    purpose: 'Sends admin invitation email with secure signup link.',
    auth: 'Super Admin Only',
    params: 'email, role'
  },
  {
    name: 'permanently-delete-specialist',
    method: 'POST',
    purpose: 'Permanently removes specialist account and associated data.',
    auth: 'Admin Only',
    params: 'specialistId'
  },
  {
    name: 'phone-redirect',
    method: 'GET',
    purpose: 'Handles phone call redirect links for user-specialist phone connections.',
    auth: 'Token-based',
    params: 'token'
  },
  {
    name: 'phone-request-cleanup',
    method: 'POST',
    purpose: 'Cleans up expired phone call requests.',
    auth: 'System',
    params: 'none'
  },
  {
    name: 'resend-confirmation',
    method: 'POST',
    purpose: 'Resends email confirmation for unverified accounts.',
    auth: 'Public',
    params: 'email'
  },
  {
    name: 'update-specialist-password',
    method: 'POST',
    purpose: 'Updates specialist password after first login or reset.',
    auth: 'JWT Required',
    params: 'newPassword'
  },
  {
    name: 'check-password-status',
    method: 'POST',
    purpose: 'Checks if specialist needs to change temporary password.',
    auth: 'JWT Required',
    params: 'specialistId'
  },
  {
    name: 'conoco-auth',
    method: 'POST',
    purpose: 'Custom authentication for ConocoPhillips employer portal.',
    auth: 'Domain-specific',
    params: 'email, password'
  },
  {
    name: 'thought-packs',
    method: 'GET/POST',
    purpose: 'Manages CBT thought pattern game content packs.',
    auth: 'JWT Required',
    params: 'action, packId'
  },
  {
    name: 'admin-import-journeys',
    method: 'POST',
    purpose: 'Bulk imports AI-generated journey content from admin panel.',
    auth: 'Admin Only',
    params: 'journeys[]'
  },
  {
    name: 'test-function',
    method: 'GET',
    purpose: 'Health check endpoint for testing edge function deployment.',
    auth: 'Public',
    params: 'none'
  }
];

// ============================================
// DATABASE TABLES DOCUMENTATION
// ============================================
export const databaseTablesDocumentation: DatabaseTableDocumentation[] = [
  {
    name: 'profiles',
    purpose: 'User profile information including name, avatar, phone, and recovery start date.',
    keyColumns: ['id', 'user_id', 'first_name', 'last_name', 'user_type'],
    relationships: ['Links to auth.users via user_id']
  },
  {
    name: 'peer_specialists',
    purpose: 'Peer specialist profiles with credentials, specialties, and verification status.',
    keyColumns: ['id', 'user_id', 'email', 'is_active', 'is_verified', 'specialties'],
    relationships: ['Links to auth.users, has many chat_sessions']
  },
  {
    name: 'chat_sessions',
    purpose: 'Chat session records between users and specialists with status tracking.',
    keyColumns: ['id', 'user_id', 'specialist_id', 'status', 'started_at', 'ended_at'],
    relationships: ['Belongs to profiles and peer_specialists']
  },
  {
    name: 'chat_messages',
    purpose: 'Individual chat messages within sessions.',
    keyColumns: ['id', 'session_id', 'sender_id', 'sender_type', 'content', 'is_read'],
    relationships: ['Belongs to chat_sessions']
  },
  {
    name: 'specialist_status',
    purpose: 'Real-time specialist online/offline/busy status.',
    keyColumns: ['id', 'specialist_id', 'status', 'last_seen'],
    relationships: ['Belongs to peer_specialists']
  },
  {
    name: 'specialist_schedules',
    purpose: 'Recurring weekly availability schedules for specialists.',
    keyColumns: ['id', 'specialist_id', 'day_of_week', 'start_time', 'end_time'],
    relationships: ['Belongs to peer_specialists']
  },
  {
    name: 'specialist_appointments',
    purpose: 'Scheduled appointments between users and specialists.',
    keyColumns: ['id', 'specialist_id', 'user_id', 'scheduled_start', 'scheduled_end', 'status'],
    relationships: ['Links peer_specialists to users']
  },
  {
    name: 'appointment_proposals',
    purpose: 'Pending appointment proposals awaiting user acceptance.',
    keyColumns: ['id', 'specialist_id', 'user_id', 'proposed_at', 'status', 'expires_at'],
    relationships: ['Links to appointment_types']
  },
  {
    name: 'appointment_types',
    purpose: 'Configurable appointment types (check-in, follow-up, etc.).',
    keyColumns: ['id', 'name', 'default_duration', 'color']
  },
  {
    name: 'notifications',
    purpose: 'User notification records for in-app and push delivery.',
    keyColumns: ['id', 'user_id', 'title', 'body', 'notification_type', 'is_read']
  },
  {
    name: 'foreman_content',
    purpose: 'Motivational content library for AI Foreman responses.',
    keyColumns: ['id', 'category', 'content_type', 'content', 'mood_targeting', 'recovery_stage']
  },
  {
    name: 'ai_generated_journeys',
    purpose: 'AI-generated 90-day journey content packages.',
    keyColumns: ['id', 'focus_area', 'journey_name', 'days', 'is_active']
  },
  {
    name: 'peer_performance_events',
    purpose: 'Event log for specialist performance tracking.',
    keyColumns: ['id', 'peer_id', 'event_type', 'session_id', 'timestamp', 'metadata']
  },
  {
    name: 'peer_monthly_metrics',
    purpose: 'Aggregated monthly performance metrics per specialist.',
    keyColumns: ['id', 'peer_id', 'month', 'avg_response_time_seconds', 'chat_completion_rate']
  },
  {
    name: 'peer_session_ratings',
    purpose: 'User ratings and feedback for completed chat sessions.',
    keyColumns: ['id', 'session_id', 'peer_id', 'user_id', 'rating', 'feedback']
  },
  {
    name: 'phone_call_requests',
    purpose: 'Phone call request workflow between users and specialists.',
    keyColumns: ['id', 'session_id', 'specialist_id', 'user_id', 'status', 'request_token']
  },
  {
    name: 'push_subscriptions',
    purpose: 'Web push notification subscription data.',
    keyColumns: ['id', 'user_id', 'endpoint', 'p256dh', 'auth']
  },
  {
    name: 'specialist_module_progress',
    purpose: 'Training module completion tracking for specialists.',
    keyColumns: ['id', 'specialist_id', 'module_id', 'is_completed', 'score']
  },
  {
    name: 'manual_sections',
    purpose: 'Specialist manual section definitions.',
    keyColumns: ['id', 'title', 'description', 'order_index', 'icon']
  },
  {
    name: 'manual_content',
    purpose: 'Content items within specialist manual sections.',
    keyColumns: ['id', 'section_id', 'title', 'content', 'order_index']
  },
  {
    name: 'user_roles',
    purpose: 'User role assignments (admin, specialist, user).',
    keyColumns: ['id', 'user_id', 'role']
  },
  {
    name: 'cbt_game_sessions',
    purpose: 'Thought pattern sorter game session records.',
    keyColumns: ['id', 'user_id', 'pack_id', 'score', 'correct_items']
  },
  {
    name: 'thought_packs',
    purpose: 'CBT thought pattern game content packs.',
    keyColumns: ['id', 'name', 'description', 'difficulty']
  },
  {
    name: 'thought_items',
    purpose: 'Individual thought items within CBT game packs.',
    keyColumns: ['id', 'pack_id', 'text', 'is_distortion', 'category']
  }
];

// ============================================
// COMPONENT CATEGORIES DOCUMENTATION
// ============================================
export const componentCategoriesDocumentation: ComponentDocumentation[] = [
  // Pages
  { name: 'Index', purpose: 'Main user app entry point with auth, onboarding, and navigation', category: 'Pages' },
  { name: 'AdminPortal', purpose: 'Admin dashboard for user management and analytics', category: 'Pages' },
  { name: 'PeerSpecialistPortal', purpose: 'Specialist portal with chat, calendar, and metrics', category: 'Pages' },
  { name: 'ConocoPortal', purpose: 'Employer-specific analytics portal for ConocoPhillips', category: 'Pages' },
  { name: 'EmployerPortal', purpose: 'Generic employer analytics and engagement dashboard', category: 'Pages' },
  { name: 'SpecialistManual', purpose: 'Specialist training manual viewer', category: 'Pages' },
  
  // Core User Features
  { name: 'DashboardHome', purpose: 'User home screen with streak, prompts, and quick actions', category: 'User Features' },
  { name: 'RecoveryJourney', purpose: '90-day recovery journey with daily content', category: 'User Features' },
  { name: 'Toolbox', purpose: 'Recovery tools hub (breathing, urge tracker, gratitude)', category: 'User Features' },
  { name: 'ForemanChat', purpose: 'AI coach chat interface', category: 'User Features' },
  { name: 'PeerChatRefactored', purpose: 'User-side peer specialist chat', category: 'User Features' },
  { name: 'UserProfile', purpose: 'User profile, settings, and stats', category: 'User Features' },
  
  // Toolbox Components
  { name: 'BreathingExercise', purpose: 'Guided breathing exercise (SteadySteel)', category: 'Toolbox' },
  { name: 'UrgeTracker', purpose: 'Urge logging and coping tool (Redline Recovery)', category: 'Toolbox' },
  { name: 'GratitudeLogEnhanced', purpose: 'Daily gratitude journaling', category: 'Toolbox' },
  { name: 'TriggerIdentifier', purpose: 'Trigger identification and management', category: 'Toolbox' },
  { name: 'ThoughtPatternSorter', purpose: 'CBT thought pattern game', category: 'Toolbox' },
  { name: 'RecoveryPlanViewer', purpose: 'Personal recovery plan viewer/generator', category: 'Toolbox' },
  
  // Specialist Components
  { name: 'PeerSpecialistDashboard', purpose: 'Main specialist dashboard layout', category: 'Specialist' },
  { name: 'SpecialistChatWindowRefactored', purpose: 'Specialist chat interface', category: 'Specialist' },
  { name: 'EnhancedSpecialistCalendar', purpose: 'Full calendar with scheduling', category: 'Specialist' },
  { name: 'SpecialistPerformanceMetrics', purpose: 'Performance stats and goals', category: 'Specialist' },
  { name: 'SpecialistTrainingDashboard', purpose: 'Training module interface', category: 'Specialist' },
  
  // Admin Components
  { name: 'AdminDashboard', purpose: 'Admin main dashboard', category: 'Admin' },
  { name: 'UserManagement', purpose: 'User list and management', category: 'Admin' },
  { name: 'PeerSpecialistManagement', purpose: 'Specialist onboarding and management', category: 'Admin' },
  { name: 'EmployerAnalyticsDashboard', purpose: 'Employer-facing analytics', category: 'Admin' },
  
  // Auth & Onboarding
  { name: 'AuthForm', purpose: 'Login/signup form', category: 'Auth' },
  { name: 'OnboardingFlow', purpose: 'New user onboarding wizard', category: 'Auth' },
  { name: 'SpecialistLogin', purpose: 'Specialist authentication', category: 'Auth' },
  { name: 'PasswordReset', purpose: 'Password reset flow', category: 'Auth' },
  
  // UI Components
  { name: 'BottomNavigation', purpose: 'Mobile bottom nav bar', category: 'UI' },
  { name: 'SplashScreen', purpose: 'App loading splash screen', category: 'UI' },
  { name: 'BadgeCelebrationModal', purpose: 'Badge earned celebration', category: 'UI' },
  { name: 'PWAInstallPrompt', purpose: 'PWA installation prompt', category: 'UI' },
  { name: 'OfflineIndicator', purpose: 'Offline status indicator', category: 'UI' }
];

// ============================================
// ARCHITECTURE OVERVIEW
// ============================================
export const architectureOverview = {
  stack: {
    frontend: 'React 19 with TypeScript',
    styling: 'Tailwind CSS with custom design tokens',
    stateManagement: 'TanStack Query + React hooks',
    routing: 'React Router v6',
    ui: 'shadcn/ui components (Radix primitives)',
    backend: 'Supabase (PostgreSQL, Auth, Realtime, Edge Functions)',
    hosting: 'Lovable Cloud with Supabase integration'
  },
  
  folderStructure: `
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── calendar/       # Calendar-related components
│   ├── chat/           # Chat-related components
│   ├── training/       # Training module components
│   └── conoco/         # Employer-specific components
├── contexts/           # React context providers
├── data/               # Static data and constants
├── hooks/              # Custom React hooks
│   └── chat/           # Chat-specific hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility libraries
├── pages/              # Route page components
├── services/           # API service modules
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

supabase/
├── config.toml         # Supabase configuration
├── functions/          # Edge functions
│   ├── _shared/        # Shared utilities
│   └── [function]/     # Individual functions
└── migrations/         # Database migrations

docs/                   # Documentation files
public/                 # Static assets
  `,
  
  dataFlow: `
User Action → React Component → Custom Hook → Service/Supabase Client
                                    ↓
                              State Update ← Realtime Subscription
                                    ↓
                              UI Re-render
  `,
  
  authFlow: `
1. User enters credentials in AuthForm
2. Supabase Auth validates and returns session
3. useAuth hook stores session and user state
4. Protected routes check isAuthenticated
5. JWT token included in API requests
6. Edge functions verify JWT via supabase.auth.getUser()
  `
};

// ============================================
// APP INFO
// ============================================
export const appInfo = {
  name: 'LEAP Recovery',
  fullName: 'Life Enhancement and Peer Support',
  version: '1.0.0',
  description: 'A Progressive Web App (PWA) for addiction recovery support featuring AI coaching, peer specialist connections, and a structured 90-day recovery journey.',
  targetAudience: [
    'Individuals in addiction recovery',
    'Peer Support Specialists',
    'Recovery program administrators',
    'Employer wellness programs'
  ],
  keyFeatures: [
    '90-day structured recovery journey',
    'AI-powered Foreman coach',
    'Real-time peer specialist chat',
    'Recovery toolbox (breathing, gratitude, urge tracking)',
    'Badge and streak gamification',
    'Calendar scheduling with specialists',
    'Offline-capable PWA',
    'Multi-language support (English/Spanish)'
  ]
};
