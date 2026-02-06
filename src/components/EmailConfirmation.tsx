import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type ConfirmationState = 'loading' | 'success' | 'error';

const VERIFY_TIMEOUT_MS = 8000;

export function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runVerification = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);

    const type = searchParams.get('type');

    if (type === 'recovery') {
      navigate(`/reset-password?${searchParams.toString()}`);
      return;
    }

    // Support Supabase PKCE confirmation links (?code=...)
    const code = searchParams.get('code');
    if (code) {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Confirmation timed out. Please retry.')), VERIFY_TIMEOUT_MS)
        );

        await Promise.race([
          supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
            if (error) throw error;
          }),
          timeout,
        ]);

        setState('success');
        setTimeout(() => navigate('/'), 1500);
        return;
      } catch (err) {
        console.error('PKCE confirmation error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to confirm. Please retry.');
        setState('error');
        return;
      }
    }

    const token_hash = searchParams.get('token_hash');

    console.log('Email confirmation attempt:', { token_hash: !!token_hash, type, hasCode: !!code });

    if (type === 'signup' && token_hash) {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Verification is taking too long. Please retry.')), VERIFY_TIMEOUT_MS)
        );

        await Promise.race([
          supabase.auth.verifyOtp({ token_hash, type: 'email' }).then(({ error }) => {
            if (error) throw error;
          }),
          timeout,
        ]);

        setState('success');
        setTimeout(() => navigate('/'), 3000);
      } catch (err) {
        console.error('Email verification error:', err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to confirm email. The link may have expired.'
        );
        setState('error');
      }

      return;
    }

    setErrorMessage('Invalid confirmation link or missing parameters.');
    setState('error');
  }, [navigate, searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runVerification();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [runVerification]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold">Confirming your email...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we verify your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Email Confirmed!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Welcome to LEAP!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to the app in a few seconds...
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Confirmation Failed</CardTitle>
          <CardDescription>
            There was a problem confirming your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Button onClick={runVerification} className="w-full">
              Retry Confirmation
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
              Back to Login
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              If you keep seeing timeouts, your email may still be confirmed—try going back to login and signing in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
