import { Screenshot } from '@/components/ui/screenshot-gallery';

export const specialistManualScreenshots: Screenshot[] = [
  // Getting Started
  {
    id: 'login-process',
    title: 'Specialist Login Process',
    description: 'Step-by-step login procedure including password requirements and two-factor authentication',
    imageUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&h=600&fit=crop',
    category: 'Authentication',
    deviceType: 'desktop',
    section: 'authentication',
    tags: ['login', 'security', 'setup']
  },
  {
    id: 'initial-setup',
    title: 'Profile Setup Wizard',
    description: 'Complete profile configuration including specialties, availability, and notification preferences',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
    category: 'Setup',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['profile', 'setup', 'configuration']
  },
  
  // Dashboard Navigation
  {
    id: 'main-dashboard',
    title: 'Main Dashboard Layout',
    description: 'Overview of the specialist dashboard with navigation, active sessions, and key metrics',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    category: 'Navigation',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['dashboard', 'navigation', 'layout']
  },
  {
    id: 'sidebar-navigation',
    title: 'Sidebar Navigation Menu',
    description: 'Detailed view of the sidebar menu options and how to access different portal sections',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Navigation',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['sidebar', 'menu', 'navigation']
  },
  
  // Session Management
  {
    id: 'session-queue',
    title: 'Session Queue Management',
    description: 'How to view and claim waiting sessions from the user queue',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    category: 'Sessions',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['queue', 'sessions', 'claiming']
  },
  {
    id: 'active-chat',
    title: 'Active Chat Session Interface',
    description: 'Complete chat interface showing message history, user info, and specialist tools',
    imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&h=600&fit=crop',
    category: 'Sessions',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['chat', 'active-session', 'interface']
  },
  {
    id: 'session-notes',
    title: 'Session Documentation',
    description: 'How to add notes and document session outcomes for continuity of care',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    category: 'Documentation',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['notes', 'documentation', 'records']
  },
  
  // Calendar & Scheduling
  {
    id: 'calendar-overview',
    title: 'Calendar Interface',
    description: 'Monthly and weekly calendar views showing appointments and availability',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    category: 'Scheduling',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['calendar', 'appointments', 'scheduling']
  },
  {
    id: 'set-availability',
    title: 'Setting Availability',
    description: 'Step-by-step process for configuring working hours and time-off periods',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&h=600&fit=crop',
    category: 'Scheduling',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['availability', 'working-hours', 'configuration']
  },
  {
    id: 'appointment-creation',
    title: 'Creating Appointments',
    description: 'How to schedule appointments with users and send appointment proposals',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    category: 'Scheduling',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['appointments', 'proposals', 'scheduling']
  },
  
  // Status Management
  {
    id: 'status-indicators',
    title: 'Status Management',
    description: 'Understanding and managing your availability status (Online, Away, Busy, Offline)',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop',
    category: 'Status',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['status', 'availability', 'indicators']
  },
  {
    id: 'automatic-status',
    title: 'Automatic Status Updates',
    description: 'How the system automatically updates your status based on calendar and activity',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Status',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['automatic', 'status', 'calendar-sync']
  },
  
  // Settings & Configuration
  {
    id: 'profile-settings',
    title: 'Profile Settings Panel',
    description: 'Complete profile management including personal info, bio, and specialties',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
    category: 'Settings',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['profile', 'settings', 'personal-info']
  },
  {
    id: 'notification-settings',
    title: 'Notification Preferences',
    description: 'Configuring audio, email, and push notifications for different types of events',
    imageUrl: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800&h=600&fit=crop',
    category: 'Settings',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['notifications', 'audio', 'preferences']
  },
  {
    id: 'security-settings',
    title: 'Security Settings',
    description: 'Password management, two-factor authentication, and security best practices',
    imageUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&h=600&fit=crop',
    category: 'Security',
    deviceType: 'desktop',
    section: 'authentication',
    tags: ['security', 'password', '2fa']
  },
  
  // Training & Development
  {
    id: 'training-dashboard',
    title: 'Training Dashboard',
    description: 'Overview of available training modules and completion progress',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    category: 'Training',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['training', 'modules', 'progress']
  },
  {
    id: 'interactive-scenarios',
    title: 'Interactive Training Scenarios',
    description: 'Practice sessions with simulated user interactions and feedback',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
    category: 'Training',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['scenarios', 'simulation', 'practice']
  },
  {
    id: 'certification-tracking',
    title: 'Certification Progress',
    description: 'Tracking certification requirements and continuing education credits',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    category: 'Training',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['certification', 'credits', 'requirements']
  },
  
  // Performance & Analytics
  {
    id: 'performance-metrics',
    title: 'Performance Dashboard',
    description: 'Personal performance metrics including session counts, satisfaction ratings, and response times',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Analytics',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['performance', 'metrics', 'analytics']
  },
  {
    id: 'feedback-reports',
    title: 'User Feedback Reports',
    description: 'Anonymous user feedback and satisfaction surveys to improve service delivery',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    category: 'Analytics',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['feedback', 'satisfaction', 'reports']
  },
  
  // Mobile Access
  {
    id: 'mobile-specialist-app',
    title: 'Mobile Specialist Access',
    description: 'How to access specialist features on mobile devices for emergency support',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop',
    category: 'Mobile',
    deviceType: 'mobile',
    section: 'overview',
    tags: ['mobile', 'emergency', 'remote-access']
  },
  {
    id: 'mobile-chat-specialist',
    title: 'Mobile Chat Interface',
    description: 'Specialized mobile chat interface for specialists responding to urgent requests',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=800&fit=crop',
    category: 'Mobile',
    deviceType: 'mobile',
    section: 'overview',
    tags: ['mobile-chat', 'urgent', 'specialist']
  },
  
  // Troubleshooting
  {
    id: 'connection-issues',
    title: 'Connection Troubleshooting',
    description: 'Common connectivity issues and how to resolve them quickly',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
    category: 'Troubleshooting',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['troubleshooting', 'connectivity', 'support']
  },
  {
    id: 'browser-compatibility',
    title: 'Browser Requirements',
    description: 'Supported browsers and recommended settings for optimal performance',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop',
    category: 'Troubleshooting',
    deviceType: 'desktop',
    section: 'overview',
    tags: ['browser', 'compatibility', 'requirements']
  }
];