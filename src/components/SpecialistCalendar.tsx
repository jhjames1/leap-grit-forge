import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface SpecialistCalendarProps {
  specialistId: string | null;
}

const SpecialistCalendar: React.FC<SpecialistCalendarProps> = ({ specialistId }) => {
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Calendar Management</h3>
        <p className="text-muted-foreground">
          Calendar and appointment management will be available here. Specialist ID: {specialistId}
        </p>
      </Card>
    </div>
  );
};

export default SpecialistCalendar;