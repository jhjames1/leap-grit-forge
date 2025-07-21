
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Wifi } from 'lucide-react';

interface SessionInactivityWarningProps {
  secondsRemaining: number;
  onExtendSession: () => void;
  onEndSession: () => void;
}

const SessionInactivityWarning = ({ 
  secondsRemaining, 
  onExtendSession, 
  onEndSession 
}: SessionInactivityWarningProps) => {
  const [countdown, setCountdown] = useState(secondsRemaining);

  useEffect(() => {
    setCountdown(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  if (countdown <= 0) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Alert className="bg-orange-50 border-orange-200 mb-4">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Session will end due to inactivity</p>
            <p className="text-sm">Time remaining: {timeDisplay}</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onExtendSession}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Wifi size={14} className="mr-1" />
              Stay Active
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onEndSession}
              className="border-gray-500 text-gray-600 hover:bg-gray-50"
            >
              End Session
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SessionInactivityWarning;
