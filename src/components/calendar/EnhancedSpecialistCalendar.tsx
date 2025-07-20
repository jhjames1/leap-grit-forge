import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, X } from 'lucide-react';
import ScheduleManagementModal from './ScheduleManagementModal';

interface EnhancedSpecialistCalendarProps {
  specialistId: string;
  onClose: () => void;
}

const localizer = momentLocalizer(moment);

const EnhancedSpecialistCalendar: React.FC<EnhancedSpecialistCalendarProps> = ({
  specialistId,
  onClose,
}) => {
  const [events, setEvents] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Set default view to business hours (7 AM - 6 PM) but allow full day scrolling
  const getDefaultTimeRange = () => {
    const defaultMin = new Date();
    defaultMin.setHours(7, 0, 0, 0); // 7 AM default start
    
    const defaultMax = new Date();
    defaultMax.setHours(18, 0, 0, 0); // 6 PM default end
    
    return { defaultMin, defaultMax };
  };

  // Allow full 24-hour scrolling range
  const getFullTimeRange = () => {
    const fullMin = new Date();
    fullMin.setHours(0, 0, 0, 0); // Midnight start
    
    const fullMax = new Date();
    fullMax.setHours(23, 59, 59, 999); // Midnight end
    
    return { fullMin, fullMax };
  };

  const { defaultMin, defaultMax } = getDefaultTimeRange();
  const { fullMin, fullMax } = getFullTimeRange();

  useEffect(() => {
    // Fetch events based on specialistId
    // Replace this with your actual data fetching logic
    const mockEvents = [
      {
        id: 1,
        title: 'Morning Session',
        start: new Date(new Date().setHours(9, 0, 0, 0)),
        end: new Date(new Date().setHours(10, 0, 0, 0)),
        color: '#e53935'
      },
      {
        id: 2,
        title: 'Afternoon Break',
        start: new Date(new Date().setHours(14, 0, 0, 0)),
        end: new Date(new Date().setHours(15, 0, 0, 0)),
        color: '#1e88e5'
      }
    ];

    setEvents(mockEvents);
  }, [specialistId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col bg-card">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Calendar & Schedule</h2>
            <p className="text-muted-foreground">Manage your appointments and availability</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center space-x-2"
            >
              <Settings size={16} />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            defaultView="week"
            min={fullMin} // Allow scrolling from midnight
            max={fullMax} // Allow scrolling to midnight
            scrollToTime={defaultMin} // But default scroll to 7 AM
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color || '#3174ad',
                borderRadius: '4px',
                border: 'none',
                color: 'white',
                fontSize: '12px',
                padding: '2px 6px'
              }
            })}
            onSelectEvent={(event) => {
              console.log('Selected event:', event);
            }}
            onSelectSlot={(slotInfo) => {
              console.log('Selected slot:', slotInfo);
            }}
            selectable
            step={15}
            timeslots={4}
            formats={{
              timeGutterFormat: 'h:mm A',
              eventTimeRangeFormat: ({ start, end }, culture, local) => 
                `${local.format(start, 'h:mm A', culture)} - ${local.format(end, 'h:mm A', culture)}`
            }}
          />
        </div>
      </Card>

      {/* Schedule Management Modal */}
      <ScheduleManagementModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        specialistId={specialistId}
      />
    </div>
  );
};

export default EnhancedSpecialistCalendar;
