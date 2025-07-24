import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ConocoFeatureUsageProps {
  dateRange: string;
  department: string;
}

export function ConocoFeatureUsage({ dateRange, department }: ConocoFeatureUsageProps) {
  // Mock data - replace with actual API calls
  const data = [
    { name: 'Chat Sessions', value: 35, color: 'hsl(var(--chart-1))' },
    { name: 'Crisis Support', value: 25, color: 'hsl(var(--chart-2))' },
    { name: 'Resource Library', value: 20, color: 'hsl(var(--chart-3))' },
    { name: 'Wellness Tools', value: 15, color: 'hsl(var(--chart-4))' },
    { name: 'Assessments', value: 5, color: 'hsl(var(--chart-5))' },
  ];

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800 font-oswald">Feature Usage Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Usage']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}