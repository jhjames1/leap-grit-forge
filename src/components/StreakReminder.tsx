
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, X } from 'lucide-react';

interface StreakReminderProps {
  onAction: () => void;
  onClose: () => void;
}

const StreakReminder = ({ onAction, onClose }: StreakReminderProps) => {
  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6 max-w-sm w-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-construction p-2 rounded-lg">
              <Flame className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-lg">Keep Your Streak</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-steel-light hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="space-y-4">
          <p className="text-steel-light text-center">
            You're 3 hours away from losing your streak.<br/>
            Check in to keep your momentum strong.
          </p>
          
          <Button
            onClick={onAction}
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold py-3"
          >
            ✅ Take a LEAP Now
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StreakReminder;
