import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface ConocoEngagementChartProps {
  dateRange: string;
  department: string;
}

export function ConocoEngagementChart({ dateRange, department }: ConocoEngagementChartProps) {
  // Generate dynamic data based on date range
  const data = useMemo(() => {
    const today = new Date();
    const daysBack = parseInt(dateRange);
    const startDate = subDays(today, daysBack - 1);
    
    const dateRange_array = eachDayOfInterval({
      start: startDate,
      end: today
    });

    return dateRange_array.map((date, index) => {
      // Generate realistic mock data that varies by day
      const baseSession = 45 + Math.floor(Math.sin(index * 0.5) * 15) + Math.floor(Math.random() * 20);
      const baseUsers = Math.floor(baseSession * (0.6 + Math.random() * 0.3));
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        sessions: baseSession,
        users: baseUsers
      };
    });
  }, [dateRange]);

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800 font-oswald">Engagement Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                className="text-muted-foreground"
              />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Sessions"
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Unique Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}