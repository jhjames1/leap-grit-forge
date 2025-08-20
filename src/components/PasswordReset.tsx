import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function PasswordReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const handlePasswordReset = async () => {
      console.log('Password reset component loaded');
      console.log('Current URL:', window.location.href);
      
      // Check for tokens in URL
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      console.log('URL parameters:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        tokenHash: !!tokenHash,
        type
      });

      // Only proceed if we have valid reset tokens
      if (type === 'recovery' || accessToken || tokenHash) {
        try {
          let sessionError = null;
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            sessionError = error;
          } else if (tokenHash) {
            console.log('Verifying OTP with token hash');
            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            });
            sessionError = error;
          }
          
          if (sessionError) {
            console.error('Authentication error:', sessionError);
            setError('Invalid or expired reset link. Please request a new password reset.');
          } else {
            console.log('Authentication successful - ready to update password');
          }
        } catch (err) {
          console.error('Unexpected error:', err);
          setError('An error occurred. Please try requesting a new password reset.');
        }
      }
    };

    handlePasswordReset();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You will be redirected to the main page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>

          {error && (
            <Alert className="mt-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}