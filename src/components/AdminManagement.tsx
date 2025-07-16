import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Loader2, UserPlus, UserMinus, Key, Mail, Calendar, AlertTriangle } from 'lucide-react';

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  role_created_at: string;
}

export default function AdminManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error loading admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load administrator list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    setIsAddingAdmin(true);
    try {
      // First, check if user exists
      const { data: existingUser } = await supabase
        .rpc('find_user_by_email', { user_email: newAdminEmail })
        .single();

      if (existingUser) {
        // User exists, add admin role directly
        if (existingUser.is_admin) {
          toast({
            title: "Already an Admin",
            description: "This user is already an administrator",
            variant: "destructive"
          });
          return;
        }

        const { data: result } = await supabase
          .rpc('add_admin_role', { target_user_id: existingUser.user_id })
          .single();

        if ((result as any).success) {
          toast({
            title: "Success",
            description: "Administrator role granted successfully",
          });
          await loadAdminUsers();
          setNewAdminEmail('');
        } else {
          toast({
            title: "Error",
            description: (result as any).error || "Failed to grant admin role",
            variant: "destructive"
          });
        }
      } else {
        // User doesn't exist, send invitation
        await sendInvitation(newAdminEmail);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive"
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const sendInvitation = async (email: string) => {
    setIsInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { 
          email,
          inviterName: user?.email || 'Administrator'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Invitation Sent",
          description: data.userExists 
            ? "Admin role granted and notification sent"
            : "Invitation email sent successfully",
        });
        if (data.userExists) {
          await loadAdminUsers();
        }
        setNewAdminEmail('');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send invitation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, userEmail: string) => {
    setProcessingUserId(userId);
    try {
      const { data: result } = await supabase
        .rpc('remove_admin_role', { target_user_id: userId })
        .single();

      if ((result as any).success) {
        toast({
          title: "Success",
          description: "Administrator access removed successfully",
        });
        await loadAdminUsers();
      } else {
        toast({
          title: "Error",
          description: (result as any).error || "Failed to remove admin role",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: "Error",
        description: "Failed to remove administrator access",
        variant: "destructive"
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      const { data: result } = await supabase
        .rpc('request_admin_password_reset', { target_email: email })
        .single();

      if ((result as any).success) {
        // Trigger password reset email through Supabase Auth
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });

        if (error) throw error;

        toast({
          title: "Password Reset Sent",
          description: "Password reset email has been sent to the administrator",
        });
      } else {
        toast({
          title: "Error",
          description: (result as any).error || "Failed to send password reset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCurrentUser = (userId: string) => userId === user?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Administrator Management</h2>
        <Badge variant="outline">
          {adminUsers.length} Administrator{adminUsers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Add New Administrator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Administrator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddAdmin}
              disabled={isAddingAdmin || isInviting || !newAdminEmail.trim()}
            >
              {isAddingAdmin || isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add Admin
            </Button>
          </div>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              If the user doesn't exist, they'll receive an invitation email. If they exist, they'll be granted admin access immediately.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Administrators */}
      <Card>
        <CardHeader>
          <CardTitle>Current Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminUsers.map((admin) => (
              <div
                key={admin.user_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {admin.email}
                      {isCurrentUser(admin.user_id) && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Admin since: {formatDate(admin.role_created_at)}
                      </span>
                      <span>Account created: {formatDate(admin.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePasswordReset(admin.email)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
                  
                  {!isCurrentUser(admin.user_id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={processingUserId === admin.user_id}
                        >
                          {processingUserId === admin.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4 mr-1" />
                          )}
                          Remove Admin
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Administrator Access</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove administrator access for {admin.email}? 
                            This action cannot be undone and they will lose all admin privileges immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(admin.user_id, admin.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}