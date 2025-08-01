import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Users, Calendar, Phone, Mail, MapPin, User, MoreHorizontal, Eye, UserX, UserCheck, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginHistoryItem {
  id: string;
  ip_address: string;
  user_agent?: string;
  login_status: string;
  location_data?: any;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  banned_until?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    recovery_start_date?: string;
    avatar_url?: string;
    user_type?: 'admin' | 'specialist' | 'peer_client';
  };
  preferences?: {
    gender?: string;
    timezone?: string;
    language?: string;
    theme?: string;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [banDuration, setBanDuration] = useState<string>('24');
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get peer_client users directly using the new user_type field
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'peer_client');

      if (profilesError) {
        console.error('Error fetching peer client profiles:', profilesError);
        toast.error('Failed to fetch user profiles');
        return;
      }

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const userIds = profiles.map(profile => profile.user_id);

      // Get auth users and preferences for these peer clients
      const { data: authUsers, error: authError } = await supabase.rpc('get_users_for_admin');
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .in('user_id', userIds);

      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError);
      }

      // Filter auth users to only include our peer clients
      const peerClientAuthUsers = authUsers?.filter(user => userIds.includes(user.id)) || [];

      // Combine the data
      const combinedUsers = peerClientAuthUsers.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: profiles.find(p => p.user_id === user.id),
        preferences: preferences?.find(p => p.user_id === user.id)
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email?.toLowerCase().includes(searchLower) ||
        user.profile?.first_name?.toLowerCase().includes(searchLower) ||
        user.profile?.last_name?.toLowerCase().includes(searchLower) ||
        user.profile?.phone_number?.includes(searchTerm) ||
        user.preferences?.gender?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredUsers(filtered);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullName = (user: UserData) => {
    const firstName = user.profile?.first_name || '';
    const lastName = user.profile?.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return 'No name provided';
  };

  const getUserStatus = (user: UserData): { status: string; color: string; isBanned: boolean } => {
    // For now, all users are active since ban functionality needs proper implementation
    return { status: 'Active', color: 'secondary', isBanned: false };
  };

  const handleBanUser = async (user: UserData, duration?: number) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'ban_user',
          userId: user.id,
          banDuration: duration,
          reason: banReason || undefined
        }
      });

      if (error) throw error;

      toast.success(duration ? `User banned for ${duration} hours` : "User permanently banned");
      setBanReason('');
      setShowBanModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (user: UserData) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'unban_user',
          userId: user.id
        }
      });

      if (error) throw error;

      toast.success("User unbanned successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to unban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLoginHistory = async (user: UserData) => {
    setSelectedUser(user);
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'get_login_history',
          userId: user.id,
          limit: 100
        }
      });

      if (error) throw error;

      setLoginHistory(data || []);
      setShowLoginHistory(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch login history");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (user: UserData) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'reset_password',
          userId: user.id,
          userEmail: user.email
        }
      });

      if (error) throw error;

      if (data.temporary_password) {
        toast.success(
          `Password reset successfully! Temporary password: ${data.temporary_password}`,
          { duration: 10000 }
        );
      } else {
        toast.success("Password reset successfully");
      }
      
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-3 rounded-sm">
            <Users className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h2 className="font-fjalla font-bold text-2xl text-foreground tracking-wide">PEER CLIENT MANAGEMENT</h2>
            <p className="text-muted-foreground text-sm">Manage peer clients - app users receiving support services</p>
          </div>
        </div>
        <Button 
          onClick={fetchUsers}
          variant="outline"
          disabled={isLoading}
          className="border-primary text-primary hover:bg-primary/10"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by name, email, phone, or gender..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card p-4 rounded-lg border-0 shadow-none">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <Users className="text-primary-foreground" size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-card-foreground">{users.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Users</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <User className="text-primary-foreground" size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-card-foreground">
                {users.filter(u => u.profile?.first_name || u.profile?.last_name).length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">With Profiles</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <Phone className="text-primary-foreground" size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-card-foreground">
                {users.filter(u => u.profile?.phone_number).length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">With Phone</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="bg-card p-8 rounded-lg border-0 shadow-none text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </p>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const userStatus = getUserStatus(user);
            return (
              <Card key={user.id} className="bg-card p-6 rounded-lg border-0 shadow-none">
                {/* User ID Header with Actions */}
                <div className="mb-4 pb-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      User ID: <span className="font-mono text-foreground">{user.id}</span>
                    </h3>
                    <Badge variant={userStatus.color as any}>
                      {userStatus.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewLoginHistory(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Login History
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleResetPassword(user)}
                        disabled={actionLoading}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      {userStatus.isBanned ? (
                        <DropdownMenuItem 
                          onClick={() => handleUnbanUser(user)}
                          disabled={actionLoading}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanModal(true);
                          }}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Ban User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Basic Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="text-foreground font-medium">{getFullName(user)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined: </span>
                      <span className="text-foreground">{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Recovery Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Contact & Recovery</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="text-foreground">
                        {user.profile?.phone_number || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recovery Start: </span>
                      <span className="text-foreground">
                        {user.profile?.recovery_start_date ? formatDate(user.profile.recovery_start_date) : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Demographics & Preferences */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Demographics & Preferences</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gender: </span>
                      <span className="text-foreground">
                        {user.preferences?.gender || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Language: </span>
                      <Badge variant="outline" className="text-xs">
                        {user.preferences?.language?.toUpperCase() || 'EN'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timezone: </span>
                      <span className="text-foreground text-xs">
                        {user.preferences?.timezone || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </Card>
            );
          })
        )}
      </div>

      {/* Ban User Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Choose ban duration for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ban Duration</label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                  <SelectItem value="168">1 Week</SelectItem>
                  <SelectItem value="720">30 Days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && handleBanUser(selectedUser, banDuration === 'permanent' ? undefined : parseInt(banDuration))}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History Modal */}
      <Dialog open={showLoginHistory} onOpenChange={setShowLoginHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Login History</DialogTitle>
            <DialogDescription>
              Recent login attempts for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {loginHistory.length > 0 ? (
              <div className="space-y-2">
                {loginHistory.map((login) => (
                  <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={login.login_status === 'success' ? 'secondary' : 'destructive'}>
                          {login.login_status}
                        </Badge>
                        <span className="font-mono text-sm">{login.ip_address}</span>
                      </div>
                      {login.user_agent && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {login.user_agent}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(login.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No login history found
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLoginHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
