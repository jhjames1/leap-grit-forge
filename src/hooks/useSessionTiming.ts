import { useState, useEffect, useRef } from 'react';

interface UseSessionTimingProps {
  onFifteenMinuteMark?: () => void;
  checkInterval?: number; // in milliseconds, default 30 seconds
}

export const useSessionTiming = ({ 
  onFifteenMinuteMark, 
  checkInterval = 30000 
}: UseSessionTimingProps = {}) => {
  const [sessionStartTime] = useState(new Date());
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);
  const [hasTriggeredFifteenMinute, setHasTriggeredFifteenMinute] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateSessionDuration = () => {
      const now = new Date();
      const durationMs = now.getTime() - sessionStartTime.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      setSessionDurationMinutes(durationMinutes);

      // Trigger callback at 15-minute mark
      if (durationMinutes >= 15 && !hasTriggeredFifteenMinute && onFifteenMinuteMark) {
        setHasTriggeredFifteenMinute(true);
        onFifteenMinuteMark();
      }
    };

    // Update immediately
    updateSessionDuration();

    // Set up interval
    intervalRef.current = setInterval(updateSessionDuration, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionStartTime, checkInterval, onFifteenMinuteMark, hasTriggeredFifteenMinute]);

  return {
    sessionStartTime,
    sessionDurationMinutes: Math.round(sessionDurationMinutes * 10) / 10, // Round to 1 decimal
    hasTriggeredFifteenMinute
  };
};