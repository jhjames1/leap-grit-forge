
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ArrowLeft, Trophy } from 'lucide-react';
import { format, isToday, isSameDay } from 'date-fns';

interface RecoveryCalendarProps {
  onBack: () => void;
}

const RecoveryCalendar = ({ onBack }: RecoveryCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Mock recovery days - in a real app, this would come from user data
  const recoveryDays = [
    new Date(2024, 5, 7), // June 7, 2024
    new Date(2024, 5, 8),
    new Date(2024, 5, 9),
    new Date(2024, 5, 10),
    new Date(2024, 5, 11),
    new Date(2024, 5, 12),
    new Date(2024, 5, 13),
    new Date(2024, 5, 14),
    new Date(2024, 5, 15),
    new Date(2024, 5, 16),
    new Date(2024, 5, 17),
    new Date(2024, 5, 18),
    new Date(2024, 5, 19),
    new Date(2024, 5, 20),
    new Date(2024, 5, 21),
    new Date(2024, 5, 22),
    new Date(2024, 5, 23),
    new Date(2024, 5, 24),
    new Date(2024, 5, 25),
    new Date(2024, 5, 26),
    new Date(2024, 5, 27),
    new Date(2024, 5, 28),
    new Date(2024, 5, 29),
  ];

  const isRecoveryDay = (date: Date) => {
    return recoveryDays.some(recoveryDay => isSameDay(date, recoveryDay));
  };

  const currentStreak = recoveryDays.length;

  return (
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-steel-light hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="font-anton text-3xl text-white">
            <span className="font-thin italic">Recovery</span> Calendar
          </h1>
          <p className="text-steel-light font-oswald">Track your progress</p>
        </div>
      </div>

      {/* Current Streak */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mb-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-construction p-2 rounded-lg">
              <Trophy className="text-midnight" size={20} />
            </div>
            <div>
              <h3 className="font-oswald font-semibold text-white">Current Streak</h3>
              <p className="text-steel-light text-sm">Keep up the great work!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-anton text-construction">{currentStreak}</div>
            <div className="text-xs text-steel-light font-oswald">DAYS</div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-construction p-2 rounded-lg">
            <CalendarIcon className="text-midnight" size={20} />
          </div>
          <h3 className="font-oswald font-semibold text-white text-xl">Your Recovery Days</h3>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="w-full"
            modifiers={{
              recovery: recoveryDays,
              today: isToday,
            }}
            modifiersStyles={{
              recovery: {
                backgroundColor: 'rgba(247, 185, 40, 0.3)',
                color: '#F7B928',
                fontWeight: 'bold',
                border: '2px solid #F7B928',
              },
              today: {
                backgroundColor: 'rgba(113, 128, 150, 0.3)',
                color: '#718096',
                fontWeight: 'bold',
              },
            }}
            components={{
              DayContent: ({ date }) => (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span>{date.getDate()}</span>
                  {isRecoveryDay(date) && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 w-3 h-3 p-0 bg-construction text-xs flex items-center justify-center"
                    >
                      ✓
                    </Badge>
                  )}
                </div>
              ),
            }}
          />
        </div>
        
        {selectedDate && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <h4 className="font-oswald font-semibold text-white mb-2">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            {isRecoveryDay(selectedDate) ? (
              <div className="flex items-center space-x-2">
                <Badge className="bg-construction text-midnight font-oswald">
                  Recovery Day
                </Badge>
                <span className="text-steel-light text-sm">Great job staying strong!</span>
              </div>
            ) : (
              <span className="text-steel-light text-sm">No recovery day logged</span>
            )}
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark mt-6 p-4">
        <h4 className="font-oswald font-semibold text-white mb-3">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-construction rounded border-2 border-construction"></div>
            <span className="text-steel-light text-sm">Recovery Day</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-steel/30 rounded border-2 border-steel"></div>
            <span className="text-steel-light text-sm">Today</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecoveryCalendar;
