import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [signUpData, setSignUpData] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    otp: ''
  });

  const [signInData, setSignInData] = useState({
    phone: '',
    otp: ''
  });

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!showOtpInput) {
        // Send OTP for signup
        const { error } = await supabase.auth.signInWithOtp({
          phone: signUpData.phone,
          options: {
            data: {
              first_name: signUpData.firstName,
              last_name: signUpData.lastName
            }
          }
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your phone for the verification code!');
          setCurrentPhone(signUpData.phone);
          setShowOtpInput(true);
        }
      } else {
        // Verify OTP for signup
        const { error } = await supabase.auth.verifyOtp({
          phone: currentPhone,
          token: signUpData.otp,
          type: 'sms'
        });

        if (error) {
          setError('Invalid verification code. Please try again.');
        } else {
          onAuthSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!showOtpInput) {
        // Send OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: signInData.phone
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your phone for the verification code!');
          setShowOtpInput(true);
        }
      } else {
        // Verify OTP
        const { error } = await supabase.auth.verifyOtp({
          phone: signInData.phone,
          token: signInData.otp,
          type: 'sms'
        });

        if (error) {
          setError('Invalid verification code. Please try again.');
        } else {
          onAuthSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to LEAP</CardTitle>
          <CardDescription>
            Join your recovery journey with peer support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">Phone Number</Label>
                  <Input
                    id="signin-phone"
                    type="tel"
                    placeholder="Enter your phone number (+1234567890)"
                    value={signInData.phone}
                    onChange={(e) => setSignInData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                {showOtpInput && (
                  <div className="space-y-2">
                    <Label htmlFor="signin-otp">Verification Code</Label>
                    <Input
                      id="signin-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={signInData.otp}
                      onChange={(e) => setSignInData(prev => ({ ...prev, otp: e.target.value }))}
                      required
                      maxLength={6}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showOtpInput ? 'Verify Code' : 'Send Code'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname">First Name</Label>
                    <Input
                      id="signup-firstname"
                      placeholder="First name"
                      value={signUpData.firstName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-lastname">Last Name</Label>
                    <Input
                      id="signup-lastname"
                      placeholder="Last name"
                      value={signUpData.lastName}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter your phone number (+1234567890)"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                {showOtpInput && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-otp">Verification Code</Label>
                    <Input
                      id="signup-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={signUpData.otp}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, otp: e.target.value }))}
                      required
                      maxLength={6}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showOtpInput ? 'Verify Code' : 'Send Code'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 border-green-500">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}