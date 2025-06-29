
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X } from 'lucide-react';

interface SMSOptInProps {
  onClose: () => void;
}

const SMSOptIn = ({ onClose }: SMSOptInProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOptedIn, setIsOptedIn] = useState(false);

  const handleOptIn = () => {
    if (phoneNumber.trim()) {
      // Store opt-in preference
      localStorage.setItem('smsOptIn', 'true');
      localStorage.setItem('phoneNumber', phoneNumber);
      setIsOptedIn(true);
      setTimeout(() => onClose(), 2000);
    }
  };

  if (isOptedIn) {
    return (
      <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="bg-construction p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="text-midnight" size={24} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl mb-2">You're All Set!</h3>
            <p className="text-steel-light">You'll receive motivational messages and check-in reminders.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-oswald font-semibold text-white text-xl">Stay Connected</h3>
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
          <p className="text-steel-light">
            Get daily motivation and check-in reminders via SMS to support your recovery journey.
          </p>
          
          <div className="space-y-2">
            <label className="text-white font-oswald text-sm">Phone Number</label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-steel-dark/50 border-steel text-white placeholder:text-steel-light"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleOptIn}
              className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold flex-1"
            >
              Enable SMS
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-steel-light text-steel-light hover:text-white flex-1"
            >
              Skip
            </Button>
          </div>
          
          <p className="text-xs text-steel-light">
            Standard messaging rates apply. You can opt out anytime by replying STOP.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SMSOptIn;
