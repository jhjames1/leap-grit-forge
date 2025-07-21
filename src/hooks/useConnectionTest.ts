import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useConnectionTest() {
  const [connectionState, setConnectionState] = useState<{
    websocket: 'connecting' | 'connected' | 'failed' | 'unknown';
    lastPing: number | null;
    error: string | null;
  }>({
    websocket: 'unknown',
    lastPing: null,
    error: null
  });

  useEffect(() => {
    console.log('🔧 TESTING: Starting Supabase connection test...');
    
    // Create a test channel to verify WebSocket connectivity
    const testChannel = supabase.channel('connection-test', {
      config: {
        presence: { key: 'test' }
      }
    });

    let pingStartTime: number;

    testChannel.on('presence', { event: 'sync' }, () => {
      const pingEndTime = Date.now();
      const roundTripTime = pingEndTime - pingStartTime;
      
      console.log('🔧 TESTING: Presence sync received, RTT:', roundTripTime, 'ms');
      setConnectionState(prev => ({
        ...prev,
        websocket: 'connected',
        lastPing: roundTripTime,
        error: null
      }));
    });

    testChannel.subscribe((status) => {
      console.log('🔧 TESTING: Connection test status:', status);
      
      if (status === 'SUBSCRIBED') {
        setConnectionState(prev => ({ ...prev, websocket: 'connected' }));
        
        // Send a presence ping to test round-trip time
        pingStartTime = Date.now();
        testChannel.track({ ping: pingStartTime });
        
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionState(prev => ({
          ...prev,
          websocket: 'failed',
          error: `Connection failed with status: ${status}`
        }));
      } else {
        setConnectionState(prev => ({ ...prev, websocket: 'connecting' }));
      }
    });

    // Cleanup
    return () => {
      console.log('🔧 TESTING: Cleaning up connection test');
      supabase.removeChannel(testChannel);
    };
  }, []);

  return connectionState;
}