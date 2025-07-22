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
import { Shield, UserPlus, Search, MoreHorizontal, Mail, Calendar, Activity, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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

      const { data: authUsers, error: authError } = await supabase.rpc('get_admin_users');

      if (authError) throw authError;

      const adminUsers = (authUsers || []).filter((user: any) => 
        adminIds.includes(user.user_id)
      ).map((user: any) => ({
        id: user.user_id,
        email: user.email,
        created_at: user.created_at,
        role_created_at: user.role_created_at
      }));

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
        <div>
          <h2 className="text-2xl font-fjalla font-bold text-card-foreground">Administrator Management</h2>
          <p className="text-muted-foreground font-source">Manage system administrators and their access</p>
        </div>
        
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

      {/* Search and Table */}
      <Card className="bg-card border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-fjalla font-bold text-card-foreground">Administrators</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search administrators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide">Name</TableHead>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide">Email</TableHead>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide">Status</TableHead>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide">Joined</TableHead>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide">Last Sign In</TableHead>
                <TableHead className="font-oswald font-medium text-muted-foreground uppercase tracking-wide w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-source font-medium text-card-foreground">
                          {getAdminName(admin)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-source text-muted-foreground">{admin.email}</TableCell>
                  <TableCell>{getStatusBadge(admin)}</TableCell>
                  <TableCell className="font-source text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(admin.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-source text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>{formatDate(admin.last_sign_in_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-md">
                        <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewActivity(admin)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Activity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No administrators found matching your search.' : 'No administrators found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
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
                {isUpdating ? 'Updating...' : 'Update'}
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
