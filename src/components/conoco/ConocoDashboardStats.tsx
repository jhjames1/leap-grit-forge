import React from 'react';
import { TrendingUp, Users, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConocoDashboardStatsProps {
  dateRange: string;
  department: string;
}

export function ConocoDashboardStats({ dateRange, department }: ConocoDashboardStatsProps) {
  // Mock data - replace with actual API calls
  const stats = [
    {
      title: 'Active Seats Used',
      value: '847',
      total: '1,200',
      percentage: 71,
      trend: '+12%',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Unique Users Engaged',
      value: '324',
      trend: '+8%',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Total Sessions',
      value: '1,456',
      trend: '+15%',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Avg. Session Length',
      value: '24m',
      trend: '+3%',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 font-oswald">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800 font-oswald">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm text-gray-500 ml-1">
                      / {stat.total}
                    </span>
                  )}
                </div>
                {stat.percentage && (
                  <div className="text-xs text-gray-500">
                    {stat.percentage}% utilization
                  </div>
                )}
              </div>
              <div className="text-xs text-green-600 font-medium font-oswald">
                {stat.trend}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}