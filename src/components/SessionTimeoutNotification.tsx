import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTimeoutNotificationProps {
  sessionId: string;
  sessionNumber?: number;
  userName?: string;
  reason: 'auto_timeout' | 'inactivity_timeout';
  onClose?: () => void;
  onReview?: () => void;
  autoCloseDelay?: number; // milliseconds
  className?: string;
}

const SessionTimeoutNotification: React.FC<SessionTimeoutNotificationProps> = ({
  sessionId,
  sessionNumber,
  userName,
  reason,
  onClose,
  onReview,
  autoCloseDelay = 5000,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.floor(autoCloseDelay / 1000));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoCloseDelay <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          if (onClose) {
            setTimeout(onClose, 300); // Allow fade animation
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Allow fade animation
    }
  };

  const getReasonDisplay = () => {
    switch (reason) {
      case 'auto_timeout':
        return {
          title: 'Session Auto-Ended',
          description: 'This session was automatically ended due to extended inactivity.',
          icon: <Clock className="h-4 w-4" />,
          variant: 'destructive' as const
        };
      case 'inactivity_timeout':
        return {
          title: 'Session Timed Out',
          description: 'This session ended due to user inactivity.',
          icon: <AlertTriangle className="h-4 w-4" />,
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Session Ended',
          description: 'This session has ended.',
          icon: <Clock className="h-4 w-4" />,
          variant: 'secondary' as const
        };
    }
  };

  const reasonInfo = getReasonDisplay();

  if (!isVisible) return null;

  return (
    <Card 
      className={cn(
        "border-l-4 shadow-lg transition-all duration-300 ease-in-out",
        reason === 'auto_timeout' || reason === 'inactivity_timeout' 
          ? "border-l-destructive bg-destructive/5 border-destructive/20" 
          : "border-l-orange-500 bg-orange-50 border-orange-200",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <div className={cn(
                "p-2 rounded-full",
                reason === 'auto_timeout' || reason === 'inactivity_timeout' 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-orange-100 text-orange-600"
              )}>
                {reasonInfo.icon}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm text-foreground">
                  {reasonInfo.title}
                </h4>
                {sessionNumber && (
                  <Badge variant="outline" className="text-xs">
                    #{sessionNumber}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {reasonInfo.description}
              </p>
              
              {userName && (
                <p className="text-xs text-muted-foreground">
                  <strong>User:</strong> {userName}
                </p>
              )}
              
              {timeLeft > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3" />
                  <span>Auto-closing in {timeLeft}s</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {onReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReview}
                className="text-xs h-7"
              >
                Review
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionTimeoutNotification;