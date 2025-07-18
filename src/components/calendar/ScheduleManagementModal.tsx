
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, Shield, Repeat } from 'lucide-react';
import WorkingHoursManager from './WorkingHoursManager';
import BlockTimeManager from './BlockTimeManager';
import AvailabilityRulesManager from './AvailabilityRulesManager';
import RecurringPatternsManager from './RecurringPatternsManager';

interface ScheduleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialistId: string;
}

const ScheduleManagementModal = ({ isOpen, onClose, specialistId }: ScheduleManagementModalProps) => {
  const [activeTab, setActiveTab] = useState('working-hours');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-fjalla text-xl">Schedule Management</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="working-hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Working Hours
            </TabsTrigger>
            <TabsTrigger value="block-time" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Block Time
            </TabsTrigger>
            <TabsTrigger value="availability-rules" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="recurring-patterns" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="working-hours" className="mt-6">
            <WorkingHoursManager specialistId={specialistId} />
          </TabsContent>

          <TabsContent value="block-time" className="mt-6">
            <BlockTimeManager specialistId={specialistId} />
          </TabsContent>

          <TabsContent value="availability-rules" className="mt-6">
            <AvailabilityRulesManager specialistId={specialistId} />
          </TabsContent>

          <TabsContent value="recurring-patterns" className="mt-6">
            <RecurringPatternsManager specialistId={specialistId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleManagementModal;
