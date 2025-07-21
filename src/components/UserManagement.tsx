import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, Calendar, Phone, Mail, MapPin, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    recovery_start_date?: string;
    avatar_url?: string;
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // First, get users from auth
      const { data: authUsers, error: authError } = await supabase.rpc('get_users_for_admin');
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        toast.error('Failed to fetch users');
        return;
      }

      if (!authUsers || authUsers.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const userIds = authUsers.map(user => user.id);

      // Get admin users to exclude
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .in('user_id', userIds);

      // Get peer specialist users to exclude
      const { data: specialists, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('user_id')
        .in('user_id', userIds);

      if (adminError) {
        console.error('Error fetching admin roles:', adminError);
      }

      if (specialistError) {
        console.error('Error fetching specialists:', specialistError);
      }

      // Create sets of user IDs to exclude
      const adminUserIds = new Set(adminRoles?.map(role => role.user_id) || []);
      const specialistUserIds = new Set(specialists?.map(spec => spec.user_id) || []);

      // Filter out admins and specialists
      const regularUsers = authUsers.filter(user => 
        !adminUserIds.has(user.id) && !specialistUserIds.has(user.id)
      );

      if (regularUsers.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Then get their profiles and preferences using regularUsers directly
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', regularUsers.map(user => user.id));

      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .in('user_id', regularUsers.map(user => user.id));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError);
      }

      // Combine the data
      const combinedUsers = regularUsers.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: profiles?.find(p => p.user_id === user.id),
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
            <h2 className="font-fjalla font-bold text-2xl text-foreground tracking-wide">USER MANAGEMENT</h2>
            <p className="text-muted-foreground text-sm">Manage regular users (excludes administrators and specialists)</p>
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
          filteredUsers.map((user) => (
            <Card key={user.id} className="bg-card p-6 rounded-lg border-0 shadow-none">
              {/* User ID Header */}
              <div className="mb-4 pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  User ID: <span className="font-mono text-foreground">{user.id}</span>
                </h3>
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
                    <div>
                      <span className="text-muted-foreground">Theme: </span>
                      <Badge variant="outline" className="text-xs">
                        {user.preferences?.theme || 'system'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
