import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConocoThemeHeatmapProps {
  dateRange: string;
  department: string;
}

export function ConocoThemeHeatmap({ dateRange, department }: ConocoThemeHeatmapProps) {
  // Mock data - replace with actual API calls
  const themes = [
    'Work Stress', 'Anxiety', 'Depression', 'Family Issues', 'Financial Stress',
    'Burnout', 'Relationships', 'Grief', 'Substance Use', 'Career Development'
  ];

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];

  // Generate mock intensity data (0-100)
  const getIntensity = (theme: string, week: string) => {
    return Math.floor(Math.random() * 80) + 20; // 20-100
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-400';
    if (intensity >= 40) return 'bg-yellow-400';
    if (intensity >= 20) return 'bg-green-400';
    return 'bg-green-200';
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800 font-oswald">Theme Intensity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-9 gap-2 text-xs">
            <div></div>
            {weeks.map(week => (
              <div key={week} className="text-center font-medium text-gray-600 font-oswald">
                {week}
              </div>
            ))}
          </div>
          
          {themes.map(theme => (
            <div key={theme} className="grid grid-cols-9 gap-2 items-center">
              <div className="text-xs font-medium text-gray-600 truncate font-oswald">
                {theme}
              </div>
              {weeks.map(week => {
                const intensity = getIntensity(theme, week);
                return (
                  <div
                    key={`${theme}-${week}`}
                    className={`h-6 rounded ${getIntensityColor(intensity)} cursor-pointer transition-opacity hover:opacity-80`}
                    title={`${theme} - ${week}: ${intensity}% intensity`}
                  />
                );
              })}
            </div>
          ))}
          
          <div className="flex items-center gap-4 pt-4">
            <span className="text-xs font-medium text-gray-600 font-oswald">Intensity:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span className="text-xs text-gray-600">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-xs text-gray-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}