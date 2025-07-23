import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const SpecialistAnalytics: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analytics and performance metrics will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecialistAnalytics;