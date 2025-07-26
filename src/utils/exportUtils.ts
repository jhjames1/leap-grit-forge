import { SpecialistPerformance } from '@/services/adminAnalyticsService';

export const exportDevelopmentCostEstimation = () => {
  const phases = [
    {
      phase: "1. Authentication & User Management",
      description: "User registration, login, profile management, role-based access control",
      originalHours: 25,
      revisedHours: 40,
      tasks: "Registration flow, Login/logout, Password reset, Profile editing, Role management, Session handling"
    },
    {
      phase: "2. Real-time Chat System",
      description: "WebSocket chat, message handling, conversation management",
      originalHours: 40,
      revisedHours: 60,
      tasks: "WebSocket setup, Message components, Chat history, Real-time updates, Message status, File sharing"
    },
    {
      phase: "3. Specialist Management",
      description: "Specialist portal, scheduling, availability, performance metrics",
      originalHours: 35,
      revisedHours: 55,
      tasks: "Specialist dashboard, Calendar integration, Availability management, Performance tracking, Analytics, Training modules"
    },
    {
      phase: "4. Recovery Journey & Tools",
      description: "Journey tracking, toolbox features, progress monitoring",
      originalHours: 30,
      revisedHours: 45,
      tasks: "Journey calendar, Progress tracking, Recovery tools, Milestone system, Strength meter, Personal insights"
    },
    {
      phase: "5. Admin Portal & Analytics",
      description: "Administrative dashboard, user management, system analytics",
      originalHours: 30,
      revisedHours: 50,
      tasks: "Admin dashboard, User management, System analytics, Content management, Security monitoring, Reporting"
    },
    {
      phase: "6. Mobile Responsiveness & PWA",
      description: "Mobile optimization, progressive web app features",
      originalHours: 20,
      revisedHours: 35,
      tasks: "Responsive design, PWA setup, Offline functionality, Mobile navigation, Touch interactions, App installation"
    },
    {
      phase: "7. Security & Performance",
      description: "Security implementation, performance optimization, testing",
      originalHours: 25,
      revisedHours: 40,
      tasks: "Security audit, Performance optimization, Error handling, Session management, Data protection, Load testing"
    },
    {
      phase: "8. Integration & Deployment",
      description: "Third-party integrations, deployment setup, documentation",
      originalHours: 20,
      revisedHours: 32,
      tasks: "API integrations, Deployment pipeline, Environment setup, Documentation, Training materials, Launch preparation"
    }
  ];

  const baseHours = 357;
  const projectManagementOverhead = 0.25;
  const totalHours = Math.round(baseHours * (1 + projectManagementOverhead));
  
  const juniorRate = 60;
  const seniorRate = 150;
  const mixedRate = 95;
  
  const costLow = totalHours * juniorRate;
  const costHigh = totalHours * seniorRate;
  const costMixed = totalHours * mixedRate;

  const headers = [
    'Phase',
    'Description', 
    'Original Hours',
    'Revised Hours',
    'Cost (Junior @$60/hr)',
    'Cost (Senior @$150/hr)',
    'Cost (Mixed @$95/hr)',
    'Timeline (weeks)',
    'Key Tasks'
  ];

  const csvData = phases.map(phase => [
    phase.phase,
    phase.description,
    phase.originalHours.toString(),
    phase.revisedHours.toString(),
    `$${(phase.revisedHours * juniorRate).toLocaleString()}`,
    `$${(phase.revisedHours * seniorRate).toLocaleString()}`,
    `$${(phase.revisedHours * mixedRate).toLocaleString()}`,
    `${Math.ceil(phase.revisedHours / 30)} weeks`,
    phase.tasks
  ]);

  // Add summary rows
  csvData.push(['', '', '', '', '', '', '', '', '']);
  csvData.push(['SUMMARY', '', '', '', '', '', '', '', '']);
  csvData.push(['Total Base Hours', '', '', baseHours.toString(), '', '', '', '', '']);
  csvData.push(['Project Management (25%)', '', '', Math.round(baseHours * projectManagementOverhead).toString(), '', '', '', '', '']);
  csvData.push(['Total Hours', '', '', totalHours.toString(), '', '', '', '', '']);
  csvData.push(['Total Cost Range', '', '', '', `$${costLow.toLocaleString()}`, `$${costHigh.toLocaleString()}`, `$${costMixed.toLocaleString()}`, '', '']);
  csvData.push(['Timeline', '', '', '', '', '', '', '10-14 weeks', '']);
  csvData.push(['Team Size', '', '', '', '', '', '', '2-3 developers', '']);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `LEAP-development-cost-estimation-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const exportSpecialistData = (specialists: SpecialistPerformance[]) => {
  // Convert specialist data to CSV format
  const headers = [
    'Name',
    'Email', 
    'Status',
    'Is Active',
    'Is Verified',
    'Active Sessions',
    'Completed Sessions',
    'Average Rating',
    'Response Time (seconds)',
    'Workload Score (%)',
    'Performance Score (%)',
    'Last Active'
  ];

  const csvData = specialists.map(specialist => [
    specialist.name,
    specialist.email,
    specialist.status,
    specialist.isActive ? 'Yes' : 'No',
    specialist.isVerified ? 'Yes' : 'No',
    specialist.activeSessions.toString(),
    specialist.completedSessions.toString(),
    specialist.averageRating > 0 ? specialist.averageRating.toFixed(2) : 'N/A',
    specialist.responseTime.toFixed(0),
    specialist.workloadScore.toFixed(1),
    specialist.performanceScore.toFixed(1),
    new Date(specialist.lastActive).toLocaleString()
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `specialist-performance-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};