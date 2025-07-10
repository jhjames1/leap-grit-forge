
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sunrise, Sun, Sunset } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface PersonalizedGreetingProps {
  firstName?: string;
  onContinue: () => void;
}

const PersonalizedGreeting = ({ firstName, onContinue }: PersonalizedGreetingProps) => {
  const { t } = useLanguage();
  const [timeOfDay, setTimeOfDay] = useState<'morning'>('morning');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Always show morning greeting regardless of time
    setTimeOfDay('morning');
  }, []);

  const getIcon = () => {
    return <Sunrise className="text-primary" size={32} />;
  };

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onContinue, 300);
  };

  if (!visible) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="bg-card p-6 max-w-sm w-full rounded-xl shadow-sm border-0 animate-scale-in">
        <div className="text-center">
          <div className="bg-primary p-2 rounded-lg mx-auto mb-6 w-fit">
            {getIcon()}
          </div>
          
          <div className="mb-8">
            <h2 className="font-semibold text-[20px] text-card-foreground mb-3">
              {t('greeting.good')} {t(`greeting.${timeOfDay}`)}{firstName ? `, ${firstName}` : ''}.
            </h2>
            <p className="text-muted-foreground text-[16px] mb-6">
              {t('greeting.gladYoureHere')}
            </p>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 text-[16px] rounded-xl transition-all duration-200"
          >
            Let's <span className="font-fjalla italic">Leap</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PersonalizedGreeting;
