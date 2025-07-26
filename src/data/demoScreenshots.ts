import { Screenshot } from '@/components/ui/screenshot-gallery';

export const demoScreenshots: Screenshot[] = [
  // User Interface Screenshots
  {
    id: 'user-dashboard',
    title: 'User Dashboard Overview',
    description: 'Main dashboard showing recovery progress, daily activities, and quick access to tools',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'User Interface',
    deviceType: 'desktop',
    section: 'user-journey',
    tags: ['dashboard', 'progress', 'overview']
  },
  {
    id: 'chat-interface',
    title: 'Peer Chat Interface',
    description: 'Real-time chat window for connecting with peer support specialists',
    imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&h=600&fit=crop',
    category: 'Communication',
    deviceType: 'desktop',
    section: 'user-journey',
    tags: ['chat', 'messaging', 'support']
  },
  {
    id: 'mobile-chat',
    title: 'Mobile Chat Experience',
    description: 'Mobile-optimized chat interface for on-the-go support',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop',
    category: 'Communication',
    deviceType: 'mobile',
    section: 'user-journey',
    tags: ['mobile', 'chat', 'responsive']
  },
  {
    id: 'toolbox-overview',
    title: 'Recovery Toolbox',
    description: 'Collection of interactive tools for managing triggers, thoughts, and emotions',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    category: 'Tools',
    deviceType: 'desktop',
    section: 'user-journey',
    tags: ['tools', 'recovery', 'interactive']
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    description: 'Visual representation of recovery milestones and achievements',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    category: 'Analytics',
    deviceType: 'desktop',
    section: 'user-journey',
    tags: ['progress', 'analytics', 'milestones']
  },
  
  // Specialist Portal Screenshots
  {
    id: 'specialist-dashboard',
    title: 'Specialist Dashboard',
    description: 'Real-time view of active sessions, upcoming appointments, and performance metrics',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    category: 'Specialist Portal',
    deviceType: 'desktop',
    section: 'specialist-portal',
    tags: ['dashboard', 'specialist', 'metrics']
  },
  {
    id: 'session-management',
    title: 'Session Management',
    description: 'Interface for managing active chat sessions and user queue',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Specialist Portal',
    deviceType: 'desktop',
    section: 'specialist-portal',
    tags: ['sessions', 'queue', 'management']
  },
  {
    id: 'calendar-scheduling',
    title: 'Appointment Scheduling',
    description: 'Integrated calendar system for managing availability and appointments',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    category: 'Scheduling',
    deviceType: 'desktop',
    section: 'specialist-portal',
    tags: ['calendar', 'appointments', 'scheduling']
  },
  {
    id: 'training-modules',
    title: 'Training Environment',
    description: 'Interactive training scenarios and competency assessments',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    category: 'Training',
    deviceType: 'desktop',
    section: 'specialist-portal',
    tags: ['training', 'education', 'scenarios']
  },
  {
    id: 'performance-analytics',
    title: 'Performance Analytics',
    description: 'Detailed metrics on specialist performance, user satisfaction, and outcomes',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Analytics',
    deviceType: 'desktop',
    section: 'specialist-portal',
    tags: ['analytics', 'performance', 'reporting']
  },

  // Corporate Features
  {
    id: 'admin-dashboard',
    title: 'Corporate Admin Dashboard',
    description: 'Executive overview of program metrics, ROI, and organizational insights',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    category: 'Corporate',
    deviceType: 'desktop',
    section: 'corporate-benefits',
    tags: ['admin', 'corporate', 'roi']
  },
  {
    id: 'reporting-suite',
    title: 'Corporate Reporting',
    description: 'Comprehensive reporting tools for HR and leadership teams',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    category: 'Corporate',
    deviceType: 'desktop',
    section: 'corporate-benefits',
    tags: ['reporting', 'hr', 'insights']
  },

  // Mobile Experience
  {
    id: 'mobile-dashboard',
    title: 'Mobile Dashboard',
    description: 'Mobile-first design ensuring access anywhere, anytime',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop',
    category: 'Mobile Experience',
    deviceType: 'mobile',
    section: 'user-journey',
    tags: ['mobile', 'responsive', 'accessibility']
  },
  {
    id: 'tablet-interface',
    title: 'Tablet Interface',
    description: 'Optimized layout for tablet devices in both portrait and landscape modes',
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
    category: 'Mobile Experience',
    deviceType: 'tablet',
    section: 'user-journey',
    tags: ['tablet', 'responsive', 'layout']
  }
];