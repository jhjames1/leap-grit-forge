import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        setLoading(true);
        
        // Get all possible parameters from URL
        const token_hash = searchParams.get('token_hash');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const code = searchParams.get('code');
        
        // Log all parameters for debugging
        console.log('URL parameters:', {
          token_hash: !!token_hash,
          access_token: !!access_token,
          refresh_token: !!refresh_token,
          type,
          code: !!code,
          all_params: Object.fromEntries(searchParams.entries())
        });
        
        console.log('Full URL:', window.location.href);

        // Handle different auth flows
        if (token_hash && type === 'signup') {
          // Handle email confirmation for signup using token_hash
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email'
          });

          if (error) {
            console.error('Email verification error:', error);
            setError(error.message || 'Failed to confirm email. The link may have expired.');
          } else if (data) {
            console.log('Email verification successful:', data);
            setSuccess(true);
            
            // Wait a bit then redirect to home
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } else if (access_token && refresh_token) {
          // Handle session from tokens (newer Supabase format)
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('Session setup error:', error);
            setError(error.message || 'Failed to confirm email. The link may have expired.');
          } else if (data.session) {
            console.log('Session established successfully:', data);
            setSuccess(true);
            
            // Wait a bit then redirect to home
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        } else if (type === 'recovery') {
          // Handle password recovery - stay on this page but redirect after verification
          console.log('Password recovery detected, verifying tokens...');
          
          if (token_hash) {
            const { error } = await supabase.auth.verifyOtp({
              token_hash,
              type: 'recovery'
            });
            
            if (error) {
              console.error('Password recovery verification error:', error);
              setError('Invalid or expired password reset link. Please request a new one.');
            } else {
              console.log('Password recovery verification successful');
              // Redirect to password reset page without URL parameters
              navigate('/reset-password');
            }
          } else if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            if (error) {
              console.error('Password recovery session error:', error);
              setError('Invalid or expired password reset link. Please request a new one.');
            } else {
              console.log('Password recovery session established');
              // Redirect to password reset page without URL parameters  
              navigate('/reset-password');
            }
          } else {
            setError('Invalid password reset link format.');
          }
        } else {
          console.log('No valid confirmation parameters found');
          setError('Invalid confirmation link or missing parameters.');
        }
      } catch (err) {
        console.error('Unexpected error during email confirmation:', err);
        setError('An unexpected error occurred during email confirmation.');
      } finally {
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  if (loading) {
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

  if (success) {
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
          {error && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full">
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