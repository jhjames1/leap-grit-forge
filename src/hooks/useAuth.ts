import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useSingleSession } from './useSingleSession';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isNewSignUp: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);

  const baseSignOut = useCallback(async () => {
    setIsNewSignUp(false);
    await supabase.auth.signOut();
  }, []);

  // Single-session enforcement
  const { signOutWithCleanup } = useSingleSession(session, baseSignOut);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Track if this is a new sign-up event
          console.log('Auth event type:', event);
          if (event === 'SIGNED_UP') {
            console.log('New user signed up, will show onboarding');
            setIsNewSignUp(true);
          } else if (event === 'SIGNED_IN') {
            // Check if user was created very recently (within last 2 minutes)
            const userCreatedAt = session?.user?.created_at;
            const isVeryNewUser = userCreatedAt && 
              (Date.now() - new Date(userCreatedAt).getTime()) < 2 * 60 * 1000;
            
            if (isVeryNewUser) {
              console.log('User signed in but was created recently, treating as sign-up');
              setIsNewSignUp(true);
            } else {
              console.log('Existing user signed in, skipping onboarding');
              setIsNewSignUp(false);
            }
          } else {
            console.log('Auth event:', event, '- maintaining current sign-up status');
          }
          
          if (loading) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loading]);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session?.user,
    isNewSignUp,
    signOut: signOutWithCleanup
  };
}
