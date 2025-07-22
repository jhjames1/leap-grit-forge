import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordChangePromptProps {
  isOpen: boolean;
  specialistId: string;
  onComplete: () => void;
}

const PasswordChangePrompt: React.FC<PasswordChangePromptProps> = ({
  isOpen,
  specialistId,
  onComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handlePasswordChange = async () => {
    setErrorMessage(null);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setLoading(true);
    try {
      // Update password through Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // Update the must_change_password flag in the specialist profile
      const { error: profileError } = await supabase
        .from('peer_specialists')
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialistId);

      if (profileError) throw profileError;

      // Log the password change
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'password_changed',
          type: 'security',
          details: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'password_change_prompt',
            specialist_id: specialistId
          })
        });

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully."
      });

      // Clear form and notify parent
      setNewPassword('');
      setConfirmPassword('');
      onComplete();
      
    } catch (error) {
      console.error('Error updating password:', error);
      setErrorMessage(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Temporary Password
          </DialogTitle>
          <DialogDescription>
            You're using a temporary password. For security reasons, you must create a new password to continue.
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangePrompt;