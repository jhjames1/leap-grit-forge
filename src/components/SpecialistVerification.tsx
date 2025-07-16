import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface VerificationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  specialist: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  isExpired: boolean;
}

const SpecialistVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    loading: true,
    error: null,
    success: false,
    specialist: null,
    isExpired: false
  });
  
  const [passwordForm, setPasswordForm] = useState({
    temporaryPassword: '',
    newPassword: '',
    confirmPassword: '',
    showTempPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });
  
  const [isActivating, setIsActivating] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationState({
        loading: false,
        error: 'Invalid verification link',
        success: false,
        specialist: null,
        isExpired: false
      });
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setVerificationState(prev => ({ ...prev, loading: true }));

      // Look up the specialist by invitation token
      const { data: specialist, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (specialistError) {
        throw new Error('Invalid or expired invitation token');
      }

      // Check if token is expired
      const expiresAt = new Date(specialist.invitation_expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        setVerificationState({
          loading: false,
          error: 'This invitation has expired. Please contact your administrator for a new invitation.',
          success: false,
          specialist: null,
          isExpired: true
        });
        return;
      }

      // Get user email from auth
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(specialist.user_id);
      
      if (userError) {
        throw new Error('Unable to retrieve user information');
      }

      // Check if already activated
      if (specialist.activated_at) {
        setVerificationState({
          loading: false,
          error: null,
          success: true,
          specialist: {
            first_name: specialist.first_name,
            last_name: specialist.last_name,
            email: user.user?.email || 'No email found'
          },
          isExpired: false
        });
        return;
      }

      setVerificationState({
        loading: false,
        error: null,
        success: false,
        specialist: {
          first_name: specialist.first_name,
          last_name: specialist.last_name,
          email: user.user?.email || 'No email found'
        },
        isExpired: false
      });

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState({
        loading: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        success: false,
        specialist: null,
        isExpired: false
      });
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !verificationState.specialist) {
      toast({
        title: "Error",
        description: "Invalid verification state",
        variant: "destructive"
      });
      return;
    }

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsActivating(true);

      // First, verify the temporary password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: verificationState.specialist.email,
        password: passwordForm.temporaryPassword
      });

      if (signInError) {
        throw new Error('Invalid temporary password');
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        throw new Error('Failed to update password');
      }

      // Update the specialist record to mark as activated
      const { error: specialistError } = await supabase
        .from('peer_specialists')
        .update({
          activated_at: new Date().toISOString(),
          is_invitation_accepted: true,
          must_change_password: false,
          invitation_token: null // Clear the token
        })
        .eq('invitation_token', token);

      if (specialistError) {
        throw new Error('Failed to activate account');
      }

      setVerificationState(prev => ({
        ...prev,
        success: true
      }));

      toast({
        title: "Success",
        description: "Account activated successfully! You can now access the specialist portal."
      });

      // Redirect to specialist portal after a short delay
      setTimeout(() => {
        navigate('/specialist');
      }, 2000);

    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Activation failed',
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  const togglePasswordVisibility = (field: 'temp' | 'new' | 'confirm') => {
    setPasswordForm(prev => ({
      ...prev,
      [`show${field === 'temp' ? 'TempPassword' : field === 'new' ? 'NewPassword' : 'ConfirmPassword'}`]: !prev[`show${field === 'temp' ? 'TempPassword' : field === 'new' ? 'NewPassword' : 'ConfirmPassword'}`]
    }));
  };

  if (verificationState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying your invitation...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (verificationState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">{verificationState.error}</p>
            {verificationState.isExpired && (
              <p className="text-sm text-muted-foreground">
                Please contact your administrator to resend the invitation.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (verificationState.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Account Activated!</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to LEAP, {verificationState.specialist?.first_name}! Your account has been successfully activated.
            </p>
            <p className="text-sm text-muted-foreground">
              You will be redirected to the specialist portal shortly...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Activate Your Account</h2>
          <p className="text-muted-foreground">
            Welcome, {verificationState.specialist?.first_name}! Complete the setup to access your specialist portal.
          </p>
        </div>

        <form onSubmit={handleActivation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={verificationState.specialist?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temporaryPassword">Temporary Password</Label>
            <div className="relative">
              <Input
                id="temporaryPassword"
                type={passwordForm.showTempPassword ? 'text' : 'password'}
                value={passwordForm.temporaryPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, temporaryPassword: e.target.value }))}
                required
                placeholder="Enter the temporary password from your email"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => togglePasswordVisibility('temp')}
              >
                {passwordForm.showTempPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={passwordForm.showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                placeholder="Create a new secure password"
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => togglePasswordVisibility('new')}
              >
                {passwordForm.showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                placeholder="Confirm your new password"
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {passwordForm.showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isActivating}
          >
            {isActivating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                <span>Activating...</span>
              </div>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Activate Account
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Need help? Contact your administrator.</p>
        </div>
      </Card>
    </div>
  );
};

export default SpecialistVerification;