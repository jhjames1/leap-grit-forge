import { SpecialistPerformance } from '@/services/adminAnalyticsService';

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