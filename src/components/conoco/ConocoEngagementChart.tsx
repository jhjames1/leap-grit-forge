import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConocoEngagementChartProps {
  dateRange: string;
  department: string;
}

export function ConocoEngagementChart({ dateRange, department }: ConocoEngagementChartProps) {
  // Mock data - replace with actual API calls
  const data = [
    { date: '2024-01-01', sessions: 45, users: 32 },
    { date: '2024-01-02', sessions: 52, users: 38 },
    { date: '2024-01-03', sessions: 48, users: 35 },
    { date: '2024-01-04', sessions: 61, users: 42 },
    { date: '2024-01-05', sessions: 55, users: 40 },
    { date: '2024-01-06', sessions: 67, users: 48 },
    { date: '2024-01-07', sessions: 58, users: 43 },
    { date: '2024-01-08', sessions: 72, users: 51 },
    { date: '2024-01-09', sessions: 65, users: 46 },
    { date: '2024-01-10', sessions: 79, users: 55 },
    { date: '2024-01-11', sessions: 68, users: 49 },
    { date: '2024-01-12', sessions: 75, users: 52 },
    { date: '2024-01-13', sessions: 82, users: 58 },
    { date: '2024-01-14', sessions: 71, users: 50 },
  ];

  return (
    <Card className="bg-steel-darker border-steel-dark">
      <CardHeader>
        <CardTitle className="text-white font-oswald">Engagement Over Time</CardTitle>
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