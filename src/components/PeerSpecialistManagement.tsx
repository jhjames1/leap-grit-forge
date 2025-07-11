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
import { 
  UserPlus, 
  Edit, 
  Check, 
  X, 
  Users,
  AlertCircle,
  Search
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

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-400 mt-1" size={20} />
          <div>
            <h3 className="text-blue-400 font-semibold mb-1">How to add specialists:</h3>
            <p className="text-blue-300 text-sm">
              1. Users must first create accounts by signing up normally
              <br />
              2. Search and select the user by their email address below
              <br />
              3. Fill in their specialist details and add them to the program
              <br />
              4. They can then access the Specialist Dashboard at /specialist
            </p>
          </div>
        </div>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-construction/20 p-2 rounded-lg">
            <Users className="text-construction" size={20} />
          </div>
          <h2 className="font-oswald font-semibold text-white text-xl">Peer Specialists</h2>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-construction text-midnight hover:bg-construction/90"
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
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <p className="text-steel-light text-center">Loading specialists...</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="bg-white/10 backdrop-blur-sm border-steel-dark p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-construction/20 rounded-full flex items-center justify-center">
                    {specialist.avatar_url ? (
                      <img 
                        src={specialist.avatar_url} 
                        alt={`${specialist.first_name} ${specialist.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="text-construction" size={20} />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white">
                      {specialist.first_name} {specialist.last_name}
                    </h3>
                    <p className="text-steel-light text-sm">
                      {specialist.years_experience} years experience
                    </p>
                    {specialist.bio && (
                      <p className="text-steel-light text-sm mt-1 max-w-md truncate">
                        {specialist.bio}
                      </p>
                    )}
                    {specialist.specialties && specialist.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {specialist.specialties.map((specialty, index) => (
                          <Badge key={index} className="bg-construction/20 text-construction border-construction/30 text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={specialist.is_active}
                        onCheckedChange={() => handleStatusToggle(specialist, 'is_active')}
                      />
                      <span className="text-sm text-steel-light">Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={specialist.is_verified}
                        onCheckedChange={() => handleStatusToggle(specialist, 'is_verified')}
                      />
                      <span className="text-sm text-steel-light">Verified</span>
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
                    className="border-steel text-steel-light hover:bg-steel/10"
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {specialists.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
              <p className="text-steel-light text-center">No peer specialists found. Add your first specialist to get started.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PeerSpecialistManagement;