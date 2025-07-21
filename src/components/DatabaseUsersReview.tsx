
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Shield, UserCheck, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  role_created_at: string;
}

interface PeerSpecialist {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialties: string[];
  years_experience: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  user_email?: string;
}

export default function DatabaseUsersReview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<DatabaseUser[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_for_admin');
      
      if (usersError) throw usersError;
      
      // Load admin users
      const { data: adminsData, error: adminsError } = await supabase
        .rpc('get_admin_users');
      
      if (adminsError) throw adminsError;
      
      // Load specialists with user email
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('peer_specialists')
        .select(`
          *,
          user_email:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (specialistsError) throw specialistsError;
      
      setAllUsers(usersData || []);
      setAdminUsers(adminsData || []);
      setSpecialists(specialistsData?.map(s => ({
        ...s,
        user_email: s.user_email?.email || 'N/A'
      })) || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load database users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <h2 className="text-2xl font-bold">Database Users Review</h2>
        <Button onClick={loadAllData} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admins ({adminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="specialists" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Specialists ({specialists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({allUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sign In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.email_confirmed_at ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administrator Users ({adminUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Created</TableHead>
                    <TableHead>Admin Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(admin.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(admin.role_created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specialists">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Peer Support Specialists ({specialists.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialists.map((specialist) => (
                    <TableRow key={specialist.id}>
                      <TableCell className="font-medium">
                        {specialist.first_name} {specialist.last_name}
                      </TableCell>
                      <TableCell>{specialist.user_email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {specialist.specialties?.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{specialist.years_experience} years</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {specialist.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {specialist.is_verified ? (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(specialist.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
