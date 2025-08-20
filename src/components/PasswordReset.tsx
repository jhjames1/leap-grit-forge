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
      // Log the full URL for debugging
      console.log('Full password reset URL:', window.location.href);
      
      // Check for different token formats
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const code = searchParams.get('code');

      console.log('Password reset URL parameters:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        tokenHash: !!tokenHash,
        type,
        code: !!code,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // Show detailed error if no valid tokens found
      if (!accessToken && !refreshToken && !tokenHash && !code) {
        setError(`Invalid reset link. No valid tokens found. URL: ${window.location.href}`);
        return;
      }

      if (type === 'recovery') {
        if (accessToken && refreshToken) {
          // Handle newer token format
          console.log('Using access_token/refresh_token format');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Session setup error:', error);
            setError(`Session setup failed: ${error.message}. Please request a new password reset.`);
          } else {
            console.log('Session setup successful');
          }
        } else if (tokenHash) {
          // Handle older token_hash format
          console.log('Using token_hash format');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Token verification error:', error);
            setError(`Token verification failed: ${error.message}. Please request a new password reset.`);
          } else {
            console.log('Token verification successful');
          }
        } else if (code) {
          // Handle code format (alternative approach)
          console.log('Using code format');
          const { error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Code verification error:', error);
            setError(`Code verification failed: ${error.message}. Please request a new password reset.`);
          } else {
            console.log('Code verification successful');
          }
        } else {
          setError(`Invalid reset link format. Missing required tokens. Type: ${type}`);
        }
      } else {
        setError(`Invalid link type: ${type}. Expected 'recovery'.`);
      }
    };

    handlePasswordReset();
  }, [searchParams, navigate]);

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