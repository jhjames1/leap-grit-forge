import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

const SESSION_CHECK_INTERVAL = 30_000; // 30 seconds

/**
 * Generates a unique token for this browser tab/device session.
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Gets or creates a session token for this tab, stored in sessionStorage
 * so each tab gets its own token.
 */
function getOrCreateTabToken(): string {
  const KEY = 'leap-session-token';
  let token = sessionStorage.getItem(KEY);
  if (!token) {
    token = generateSessionToken();
    sessionStorage.setItem(KEY, token);
  }
  return token;
}

/**
 * Registers the current session in the database (upsert).
 */
async function registerSession(userId: string): Promise<void> {
  const token = getOrCreateTabToken();
  const deviceInfo = navigator.userAgent.substring(0, 200);

  const { error } = await supabase
    .from('user_active_sessions')
    .upsert(
      {
        user_id: userId,
        session_token: token,
        device_info: deviceInfo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to register session:', error);
  }
}

/**
 * Checks if the current tab's session token matches the one in the database.
 * If not, another device/tab has taken over — sign out.
 */
async function checkSessionValidity(userId: string, signOut: () => Promise<void>): Promise<void> {
  const currentToken = sessionStorage.getItem('leap-session-token');
  if (!currentToken) return;

  const { data, error } = await supabase
    .from('user_active_sessions')
    .select('session_token')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Session check error:', error);
    return;
  }

  if (data && data.session_token !== currentToken) {
    toast.error('You have been signed out because your account was logged in on another device.');
    await signOut();
  }
}

/**
 * Removes the session record on logout.
 */
async function clearSessionRecord(userId: string): Promise<void> {
  await supabase
    .from('user_active_sessions')
    .delete()
    .eq('user_id', userId);
}

/**
 * Hook that enforces single-session per user.
 * - Registers the session token on login
 * - Polls every 30s to check if another device has superseded this session
 * - Clears session record on sign-out
 */
export function useSingleSession(
  session: Session | null,
  signOut: () => Promise<void>
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registeredRef = useRef(false);

  const userId = session?.user?.id;

  // Register session on login
  useEffect(() => {
    if (!userId) {
      registeredRef.current = false;
      return;
    }

    if (!registeredRef.current) {
      registeredRef.current = true;
      registerSession(userId);
    }
  }, [userId]);

  // Poll for session validity
  useEffect(() => {
    if (!userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      checkSessionValidity(userId, signOut);
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, signOut]);

  // Provide a wrapped signOut that also clears the DB record
  const signOutWithCleanup = useCallback(async () => {
    if (userId) {
      await clearSessionRecord(userId);
    }
    await signOut();
  }, [userId, signOut]);

  return { signOutWithCleanup, registerSession: () => userId ? registerSession(userId) : Promise.resolve() };
}
