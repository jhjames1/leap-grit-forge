
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
        return <Sunrise className="text-construction" size={32} />;
      case 'afternoon':
        return <Sun className="text-construction" size={32} />;
      case 'evening':
        return <Sunset className="text-construction" size={32} />;
    }
  };

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onContinue, 300);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-6">
            {getIcon()}
          </div>
          
          <div className="mb-8">
            <h2 className="font-oswald font-bold text-white text-2xl mb-3">
              Good {timeOfDay}{firstName ? `, ${firstName}` : ''}.
            </h2>
            <p className="text-steel-light text-lg mb-6">
              I'm glad you're here.
            </p>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-bold py-3 text-lg transition-all duration-200 transform hover:scale-105"
          >
            Let's LEAP
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PersonalizedGreeting;
