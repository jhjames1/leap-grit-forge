
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logger } from '@/utils/logger';

const SUPABASE_URL = "https://xefypnmvsikrdxzepgqf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZnlwbm12c2lrcmR4emVwZ3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDk3ODcsImV4cCI6MjA2NzgyNTc4N30.ezK7UD7UDoFWJBv4X2V-oiqJQj7P2XZM1Q96o4YG5ug";

// Enhanced Supabase client with optimized real-time settings
export const realtimeSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      // Optimize real-time connection parameters
      eventsPerSecond: 10,
      // Heartbeat every 15 seconds to maintain connection
      heartbeatIntervalMs: 15000,
      // Reconnect immediately on connection loss
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 5000),
      // Enable detailed logging in development
      logger: process.env.NODE_ENV === 'development' ? logger : undefined,
    },
    // Timeout configuration
    timeout: 10000,
  },
  // Enhanced global options
  global: {
    headers: {
      'x-client-info': 'leap-peer-support/1.0.0',
    },
  },
  // Database connection optimizations
  db: {
    schema: 'public',
  },
});

// Connection health monitoring
export const monitorRealtimeConnection = () => {
  const socket = (realtimeSupabase as any).realtime?.socket;
  
  if (socket) {
    socket.onError((error: any) => {
      logger.error('Realtime socket error:', error);
    });

    socket.onClose((event: any) => {
      logger.warn('Realtime socket closed:', event);
    });

    socket.onOpen(() => {
      logger.info('Realtime socket opened');
    });
  }
};

// Initialize monitoring when the module is loaded
if (typeof window !== 'undefined') {
  // Wait for the client to be ready
  setTimeout(monitorRealtimeConnection, 1000);
}
