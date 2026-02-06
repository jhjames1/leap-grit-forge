import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type ConfirmationState = 'loading' | 'success' | 'error';

export function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailConfirmation = useCallback(async () => {
    try {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      console.log('Email confirmation attempt:', { token_hash: !!token_hash, type });

      // Handle password recovery - redirect immediately
      if (type === 'recovery') {
        navigate(`/reset-password?${searchParams.toString()}`);
        return;
      }

      if (type === 'signup' && token_hash) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        });

        if (error) {
          console.error('Email verification error:', error);
          setErrorMessage(error.message || 'Failed to confirm email. The link may have expired.');
          setState('error');
        } else if (data) {
          console.log('Email verification successful:', data);
          setState('success');
          // Redirect after short delay
          setTimeout(() => navigate('/'), 3000);
        }
      } else {
        setErrorMessage('Invalid confirmation link or missing parameters.');
        setState('error');
      }
    } catch (err) {
      console.error('Unexpected error during email confirmation:', err);
      setErrorMessage('An unexpected error occurred during email confirmation.');
      setState('error');
    }
  }, [searchParams, navigate]);

  // Defer verification to after initial render to avoid blocking page load
  useEffect(() => {
    // Use requestIdleCallback or setTimeout to defer the async work
    const timeoutId = setTimeout(() => {
      handleEmailConfirmation();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [handleEmailConfirmation]);

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
              <AlertDescription className="text-destructive">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Back to Login
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              If you continue to have issues, try signing up again or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}