import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const SpecialistAnalytics: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
        <p className="text-muted-foreground">
          Analytics and performance metrics will be displayed here.
        </p>
      </Card>
    </div>
  );
};

export default SpecialistAnalytics;