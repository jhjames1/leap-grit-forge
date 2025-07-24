import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConocoSentimentTrendProps {
  dateRange: string;
  department: string;
}

export function ConocoSentimentTrend({ dateRange, department }: ConocoSentimentTrendProps) {
  // Mock data - replace with actual API calls
  const data = [
    { week: 'Week 1', positive: 65, neutral: 25, negative: 10 },
    { week: 'Week 2', positive: 68, neutral: 22, negative: 10 },
    { week: 'Week 3', positive: 62, neutral: 28, negative: 10 },
    { week: 'Week 4', positive: 70, neutral: 20, negative: 10 },
    { week: 'Week 5', positive: 72, neutral: 18, negative: 10 },
    { week: 'Week 6', positive: 69, neutral: 21, negative: 10 },
    { week: 'Week 7', positive: 74, neutral: 16, negative: 10 },
    { week: 'Week 8', positive: 71, neutral: 19, negative: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Positive"
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Neutral"
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="hsl(var(--chart-5))" 
                strokeWidth={2}
                name="Negative"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}