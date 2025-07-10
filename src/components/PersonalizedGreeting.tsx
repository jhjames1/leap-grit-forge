
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sunrise, Sun, Sunset } from 'lucide-react';

interface PersonalizedGreetingProps {
  firstName?: string;
  onContinue: () => void;
}

const PersonalizedGreeting = ({ firstName, onContinue }: PersonalizedGreetingProps) => {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay('morning');
    } else if (hour < 18) {
      setTimeOfDay('afternoon');
    } else {
      setTimeOfDay('evening');
    }
  }, []);

  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunrise className="text-primary" size={32} />;
      case 'afternoon':
        return <Sun className="text-primary" size={32} />;
      case 'evening':
        return <Sunset className="text-primary" size={32} />;
    }
  };

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onContinue, 300);
  };

  if (!visible) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 animate-fade-in">
      <Card className="bg-white p-8 max-w-sm w-full rounded-xl shadow-sm border-0 animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            {getIcon()}
          </div>
          
          <div className="mb-8">
            <h2 className="font-semibold text-[20px] text-gray-900 mb-3">
              Good {timeOfDay}{firstName ? `, ${firstName}` : ''}.
            </h2>
            <p className="text-gray-600 text-[16px] mb-6">
              I'm glad you're here.
            </p>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full bg-[#FFCE00] hover:bg-[#E6B800] text-black font-bold py-4 text-[16px] rounded-xl transition-all duration-200"
          >
            Let's LEAP
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PersonalizedGreeting;
