import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, UserPlus, Search, MoreHorizontal, Mail, Calendar, Activity, Edit, Eye, Key, Trash2, AtSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import AdminActivityLogModal from './AdminActivityLogModal';

interface Admin {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const { user } = useAuth();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        return;
      }

      const adminIds = adminRoles.map(role => role.user_id);

      // Get auth users data
      const { data: authUsers, error: authError } = await supabase.rpc('get_admin_users');
      
      // Get profile data for admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', adminIds);

      if (authError) throw authError;
      if (profilesError) console.error('Error fetching profiles:', profilesError);

      const adminUsers = (authUsers || []).filter((user: any) => 
        adminIds.includes(user.user_id)
      ).map((user: any) => {
        const profile = profiles?.find(p => p.user_id === user.user_id);
        return {
          id: user.user_id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role_created_at: user.role_created_at
        };
      });

      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Error",
        description: "Failed to load administrators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: {
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin invitation sent successfully",
      });

      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      loadAdmins();
    } catch (error) {
      console.error('Error inviting admin:', error);
      toast({
        title: "Error",
        description: "Failed to send admin invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditFirstName(admin.first_name || '');
    setEditLastName(admin.last_name || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editFirstName,
          last_name: editLastName
        })
        .eq('user_id', selectedAdmin.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Administrator updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      setEditFirstName('');
      setEditLastName('');
      loadAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: "Error",
        description: "Failed to update administrator",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async (admin: Admin) => {
    try {
      // Generate a secure temporary password (12 chars with uppercase, lowercase, numbers)
      const tempPassword = Array.from({length: 12}, () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }).join('');
      
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'reset_password',
          adminId: admin.id,
          email: admin.email,
          newPassword: tempPassword,
          currentUserEmail: user?.email
        }
      });

      if (error) throw error;

      // Show a more prominent dialog with the password
      alert(`PASSWORD RESET SUCCESSFUL
      
Admin: ${admin.email}
Temporary Password: ${tempPassword}

⚠️ IMPORTANT:
• Copy this password immediately
• The admin must change this password on first login
• This password will not be shown again

Save this information securely!`);

      toast({
        title: "Password Reset Successfully",
        description: `Temporary password generated for ${admin.email}`,
      });

    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleChangeEmail = (admin: Admin) => {
    setSelectedAdmin(admin);
    setNewEmail(admin.email);
    setIsEmailDialogOpen(true);
  };

  const handleUpdateEmail = async () => {
    if (!selectedAdmin || !newEmail) return;
    
    setIsChangingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'change_email',
          adminId: selectedAdmin.id,
          newEmail: newEmail,
          currentUserEmail: user?.email
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email updated successfully",
      });

      setIsEmailDialogOpen(false);
      setSelectedAdmin(null);
      setNewEmail('');
      loadAdmins();
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'delete_admin',
          adminId: selectedAdmin.id,
          email: selectedAdmin.email,
          currentUserEmail: user?.email
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Administrator deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete administrator",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewActivity = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsActivityLogOpen(true);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (admin: Admin) => {
    if (!admin.email_confirmed_at) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
    
    const lastSignIn = admin.last_sign_in_at ? new Date(admin.last_sign_in_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (!lastSignIn || lastSignIn < thirtyDaysAgo) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
  };

  const getAdminName = (admin: Admin) => {
    if (admin.first_name && admin.last_name) {
      return `${admin.first_name} ${admin.last_name}`;
    }
    return 'Name not set';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-fjalla font-bold text-card-foreground">Administrator Management</h2>
            <p className="text-muted-foreground font-source">Manage system administrators and their access</p>
          </div>
        </div>
        <Card className="bg-card border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading administrators...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-3 rounded-sm">
            <Shield className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h2 className="font-fjalla font-bold text-2xl text-foreground tracking-wide">ADMINISTRATOR MANAGEMENT</h2>
            <p className="text-muted-foreground text-sm">Manage system administrators and their access</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={loadAdmins}
            variant="outline"
            disabled={loading}
            className="border-primary text-primary hover:bg-primary/10"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Administrator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Administrator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  The invited user will receive an email with instructions to set up their administrator account.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteAdmin} disabled={isInviting}>
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-sm">
                <Shield className="text-primary-foreground" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-card-foreground">{admins.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-sm">
                <Activity className="text-white" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-card-foreground">
                  {admins.filter(admin => {
                    if (!admin.email_confirmed_at) return false;
                    const lastSignIn = admin.last_sign_in_at ? new Date(admin.last_sign_in_at) : null;
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return lastSignIn && lastSignIn >= thirtyDaysAgo;
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Active Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-3 rounded-sm">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-card-foreground">
                  {admins.filter(admin => !admin.email_confirmed_at).length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Pending Invites</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search administrators by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Administrators List */}
      <div className="space-y-4">
        {filteredAdmins.length === 0 ? (
          <Card className="bg-card p-8 rounded-lg border-0 shadow-none text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No administrators found matching your search.' : 'No administrators found.'}
            </p>
          </Card>
        ) : (
          filteredAdmins.map((admin) => (
            <Card key={admin.id} className="bg-card p-6 rounded-lg border-0 shadow-none">
              {/* Admin ID Header */}
              <div className="mb-4 pb-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Admin ID: <span className="font-mono text-foreground">{admin.id}</span>
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(admin)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-md">
                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeEmail(admin)} className="cursor-pointer">
                          <AtSign className="mr-2 h-4 w-4" />
                          Change Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(admin)} className="cursor-pointer">
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewActivity(admin)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Activity
                        </DropdownMenuItem>
                        {(admin.email !== 'jjames@modecommunications.net' || user?.email === 'jjames@modecommunications.net') && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAdmin(admin)} 
                            className="cursor-pointer text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Basic Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="text-foreground font-medium">{getAdminName(admin)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground break-all">{admin.email}</span>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Account Status</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      {getStatusBadge(admin)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email Confirmed: </span>
                      <span className="text-foreground">
                        {admin.email_confirmed_at ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Dates */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Account Dates</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Joined: </span>
                      <span className="text-foreground">{formatDate(admin.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sign In: </span>
                      <span className="text-foreground">{formatDate(admin.last_sign_in_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Administrator Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAdmin} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Administrator Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                value={selectedAdmin?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                The email will be updated immediately. The administrator will be able to log in with the new email address.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEmail} disabled={isChangingEmail}>
                {isChangingEmail ? 'Updating...' : 'Change Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Administrator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                This will permanently delete the administrator account for <strong>{selectedAdmin?.email}</strong>. 
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Administrator'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Log Modal */}
      {selectedAdmin && (
        <AdminActivityLogModal
          isOpen={isActivityLogOpen}
          onClose={() => setIsActivityLogOpen(false)}
          adminId={selectedAdmin.id}
          adminEmail={selectedAdmin.email}
          adminName={getAdminName(selectedAdmin)}
        />
      )}
    </div>
  );
};

export default AdminManagement;
