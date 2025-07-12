import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistPresence } from '@/hooks/useSpecialistPresence';
import { 
  UserPlus, 
  Edit, 
  Check, 
  X, 
  Users,
  AlertCircle,
  Search,
  Activity,
  Clock,
  MessageSquare,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PeerSpecialist {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  specialties: string[] | null;
  years_experience: number;
  is_verified: boolean;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SpecialistFormData {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  avatar_url: string;
}

interface UserOption {
  id: string;
  email: string;
  created_at: string;
}

const PeerSpecialistManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { specialistStatuses, analytics, loading: presenceLoading, refreshData } = useSpecialistPresence();
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<PeerSpecialist | null>(null);
  const [formData, setFormData] = useState<SpecialistFormData>({
    user_id: '',
    first_name: '',
    last_name: '',
    bio: '',
    specialties: [],
    years_experience: 0,
    avatar_url: ''
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchSpecialists();
    fetchUsers();
  }, []);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpecialists(data || []);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch peer specialists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('🔍 [DEBUG] Starting fetchUsers...');
      console.log('🔍 [DEBUG] User authentication status:', await supabase.auth.getUser());
      
      const { data, error } = await supabase.rpc('get_users_for_admin');
      
      console.log('🔍 [DEBUG] RPC get_users_for_admin response:', { data, error });
      console.log('🔍 [DEBUG] Data type:', typeof data, 'Data length:', data?.length);
      
      if (error) {
        console.error('🔍 [DEBUG] RPC Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('🔍 [DEBUG] Setting users state with data:', data);
      setUsers(data || []);
      console.log('🔍 [DEBUG] Users state updated, count:', data?.length || 0);
      
    } catch (error) {
      console.error('🔍 [DEBUG] Error in fetchUsers:', error);
      console.error('🔍 [DEBUG] Error type:', typeof error);
      console.error('🔍 [DEBUG] Error stack:', error?.stack);
      
      toast({
        title: 'Error',
        description: `Failed to fetch users: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      first_name: '',
      last_name: '',
      bio: '',
      specialties: [],
      years_experience: 0,
      avatar_url: ''
    });
    setEditingSpecialist(null);
    setNewSpecialty('');
    setUserSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [DEBUG] Starting form submission...');
    console.log('🚀 [DEBUG] Form data:', formData);
    console.log('🚀 [DEBUG] Editing specialist:', editingSpecialist);
    console.log('🚀 [DEBUG] User authentication:', await supabase.auth.getUser());
    
    // Validation logging
    const requiredFields = ['first_name', 'last_name'];
    if (!editingSpecialist) requiredFields.push('user_id');
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof SpecialistFormData]);
    if (missingFields.length > 0) {
      console.error('🚀 [DEBUG] Missing required fields:', missingFields);
      toast({
        title: "Validation Error",
        description: `Missing required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (editingSpecialist) {
        console.log('🚀 [DEBUG] Updating existing specialist...');
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null
        };
        console.log('🚀 [DEBUG] Update data:', updateData);
        
        const { data, error } = await supabase
          .from('peer_specialists')
          .update(updateData)
          .eq('id', editingSpecialist.id)
          .select();

        console.log('🚀 [DEBUG] Update response:', { data, error });
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Specialist updated successfully"
        });
      } else {
        console.log('🚀 [DEBUG] Creating new specialist...');
        const insertData = {
          user_id: formData.user_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null,
          is_verified: false,
          is_active: true
        };
        console.log('🚀 [DEBUG] Insert data:', insertData);
        
        const { data, error } = await supabase
          .from('peer_specialists')
          .insert(insertData)
          .select();

        console.log('🚀 [DEBUG] Insert response:', { data, error });
        if (error) {
          console.error('🚀 [DEBUG] Insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Specialist added successfully"
        });
      }

      console.log('🚀 [DEBUG] Operation successful, refetching specialists...');
      fetchSpecialists();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('🚀 [DEBUG] Error saving specialist:', error);
      console.error('🚀 [DEBUG] Error type:', typeof error);
      console.error('🚀 [DEBUG] Error details:', error?.message);
      console.error('🚀 [DEBUG] Full error object:', error);
      console.error('🚀 [DEBUG] Error code:', error?.code);
      console.error('🚀 [DEBUG] Error details:', error?.details);
      console.error('🚀 [DEBUG] Error hint:', error?.hint);
      
      toast({
        title: "Error",
        description: `Failed to save specialist: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (specialist: PeerSpecialist) => {
    setEditingSpecialist(specialist);
    setFormData({
      user_id: specialist.user_id,
      first_name: specialist.first_name,
      last_name: specialist.last_name,
      bio: specialist.bio || '',
      specialties: specialist.specialties || [],
      years_experience: specialist.years_experience,
      avatar_url: specialist.avatar_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleStatusToggle = async (specialist: PeerSpecialist, field: 'is_active' | 'is_verified') => {
    try {
      const { error } = await supabase
        .from('peer_specialists')
        .update({
          [field]: !specialist[field]
        })
        .eq('id', specialist.id);

      if (error) throw error;
      
      fetchSpecialists();
      toast({
        title: "Success",
        description: `Specialist ${field === 'is_active' ? 'status' : 'verification'} updated`
      });
    } catch (error) {
      console.error('Error updating specialist:', error);
      toast({
        title: "Error",
        description: "Failed to update specialist",
        variant: "destructive"
      });
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    setFormData(prev => ({ ...prev, user_id: userId }));
  };

  // Helper functions for status display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'away': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'busy': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSpecialistStatus = (specialistId: string) => {
    return specialistStatuses.find(s => s.specialist_id === specialistId);
  };

  const getSpecialistAnalytics = (specialistId: string) => {
    return analytics.find(a => a.specialist_id === specialistId);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          {/* Left column: Title and description */}
          <div className="flex-1">
            <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
              REAL-TIME STATUS & ANALYTICS
            </p>
            <p className="text-muted-foreground text-sm">Monitor and manage specialist activity</p>
          </div>
          
          {/* Right column: Action buttons */}
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
                disabled={presenceLoading}
              >
                {presenceLoading ? 'Loading...' : 'Refresh Status'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <Users className="text-primary-foreground" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">{specialists.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Specialists</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-sm">
              <Wifi className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">
                {specialistStatuses.filter(s => s.status === 'online').length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Online Now</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <MessageSquare className="text-primary-foreground" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.reduce((sum, a) => sum + a.active_sessions, 0)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Active Sessions</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <TrendingUp className="text-primary-foreground" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">
                {Math.round(analytics.reduce((sum, a) => sum + a.total_messages, 0) / Math.max(analytics.length, 1))}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Avg Messages</div>
            </div>
          </div>
        </Card>
      </div>

      {/* How to Add Specialists Card - Light grey background with black text */}
      <Card className="bg-gray-100 p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
        <div className="flex items-start space-x-3">
          <div className="bg-primary p-3 rounded-sm">
            <AlertCircle className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h3 className="text-black font-fjalla font-bold mb-2 tracking-wide text-lg">HOW TO ADD A NEW PEER SUPPORT SPECIALIST</h3>
            <p className="text-black text-sm font-source">
              1. Peer Support Specialists must first create sign up in the LEAP app
              <br />
              2. The administrator using this portal then click Add Specialist and complete their details
              <br />
              3. Once added, the Peer Support Specialist can then access the Peer Support Dashboard at leap.app/specialist
            </p>
          </div>
        </div>
      </Card>

      {/* Add Specialist Section - Home page icon styling */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-3 rounded-sm">
            <UserPlus className="text-primary-foreground" size={20} />
          </div>
          <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">MANAGE SPECIALISTS</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Specialist
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-steel-dark border-steel">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSpecialist ? 'Edit Specialist' : 'Add New Specialist'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-white">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                    className="bg-steel border-steel-light text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-white">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                    className="bg-steel border-steel-light text-white"
                  />
                </div>
              </div>
              
              {!editingSpecialist && (
                <div className="space-y-2">
                  <Label htmlFor="user_select" className="text-white">Select User *</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email address..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 bg-steel border-steel-light text-white"
                      />
                    </div>
                    <Select value={formData.user_id} onValueChange={handleUserSelect}>
                      <SelectTrigger className="bg-steel border-steel-light text-white">
                        <SelectValue placeholder="Select a user to make specialist" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.length === 0 ? (
                          <SelectItem value="" disabled>
                            {userSearch ? 'No users found' : `No users available (Total: ${users.length}, Auth: ${users.length > 0 ? 'OK' : 'Failed'})`}
                          </SelectItem>
                        ) : (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.email}</span>
                                <span className="text-xs text-muted-foreground">
                                  Joined: {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-steel-light mt-1">
                      Debug: {users.length} users loaded, {filteredUsers.length} filtered
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="bg-steel border-steel-light text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years_experience" className="text-white">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    className="bg-steel border-steel-light text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url" className="text-white">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://..."
                    className="bg-steel border-steel-light text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Specialties</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Add specialty"
                    className="bg-steel border-steel-light text-white"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  />
                  <Button type="button" onClick={addSpecialty} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} className="bg-construction/20 text-construction border-construction/30">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-construction text-midnight hover:bg-construction/90">
                  {editingSpecialist ? 'Update' : 'Create'} Specialist
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Specialists List */}
      {loading ? (
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <p className="text-muted-foreground text-center">Loading specialists...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {specialists.map((specialist) => {
            const status = getSpecialistStatus(specialist.id);
            const analyticsData = getSpecialistAnalytics(specialist.id);
            
            return (
              <Card key={specialist.id} className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar with home page styling */}
                    <div className="bg-primary p-3 rounded-sm">
                      {specialist.avatar_url ? (
                        <img 
                          src={specialist.avatar_url} 
                          alt={`${specialist.first_name} ${specialist.last_name}`}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <Users className="text-primary-foreground" size={20} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {/* Specialist Info */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-fjalla font-bold text-card-foreground text-lg tracking-wide">
                          {specialist.first_name} {specialist.last_name}
                        </h3>
                        {/* Real-time status indicator */}
                        {status && (
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}></div>
                            <Badge className={`${getStatusBadge(status.status)} text-xs uppercase font-oswald tracking-wide`}>
                              {status.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-2">
                        {specialist.years_experience} years experience
                      </p>
                      
                      {specialist.bio && (
                        <p className="text-muted-foreground text-sm mb-3 max-w-2xl">
                          {specialist.bio}
                        </p>
                      )}
                      
                      {/* Specialties */}
                      {specialist.specialties && specialist.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {specialist.specialties.map((specialty, index) => (
                            <Badge key={index} className="bg-primary/20 text-primary border-primary/30 text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Individual Specialist Real-time Analytics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/50 p-3 rounded-sm">
                          <div className="flex items-center space-x-2">
                            <Activity className="text-primary" size={14} />
                            <div>
                              <div className="text-sm font-bold text-card-foreground">
                                {analyticsData?.total_sessions || 0}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Sessions</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-sm">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="text-primary" size={14} />
                            <div>
                              <div className="text-sm font-bold text-card-foreground">
                                {analyticsData?.active_sessions || 0}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Active Now</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-sm">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="text-primary" size={14} />
                            <div>
                              <div className="text-sm font-bold text-card-foreground">
                                {analyticsData?.total_messages || 0}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Total Messages</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="text-primary" size={14} />
                            <div>
                              <div className="text-sm font-bold text-card-foreground">
                                {status?.last_seen ? new Date(status.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Last Seen</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - right side */}
                  <div className="flex items-start space-x-4">
                     <div className="flex flex-col space-y-3">
                       <div className="flex items-center space-x-2">
                         <Switch
                           checked={specialist.is_active}
                           onCheckedChange={() => handleStatusToggle(specialist, 'is_active')}
                           className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted scale-75"
                         />
                         <span className="text-xs text-muted-foreground">Active</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <Switch
                           checked={specialist.is_verified}
                           onCheckedChange={() => handleStatusToggle(specialist, 'is_verified')}
                           className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted scale-75"
                         />
                         <span className="text-xs text-muted-foreground">Verified</span>
                       </div>
                     </div>
                    
                    <div className="flex items-center space-x-2">
                      {specialist.is_verified && (
                        <Check className="text-green-400" size={16} />
                      )}
                      {!specialist.is_active && (
                        <AlertCircle className="text-red-400" size={16} />
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleEdit(specialist)}
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Edit size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {specialists.length === 0 && (
            <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
              <p className="text-muted-foreground text-center">No peer specialists found. Add your first specialist to get started.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PeerSpecialistManagement;