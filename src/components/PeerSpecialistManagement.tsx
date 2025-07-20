import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSpecialistPresence } from '@/hooks/useSpecialistPresence';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import CoachingTips from './CoachingTips';
import RealTimeSpecialistMetrics from './RealTimeSpecialistMetrics';
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
  TrendingDown,
  Wifi,
  WifiOff,
  Mail,
  Send,
  Trash2,
  Star,
  RefreshCw,
  Key,
  Copy
} from 'lucide-react';

interface PeerSpecialist {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  bio: string | null;
  specialties: string[] | null;
  years_experience: number;
  is_verified: boolean;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  is_invitation_accepted: boolean | null;
  must_change_password: boolean | null;
  activated_at: string | null;
  activation_method: string | null;
  manually_activated_by: string | null;
}

interface SpecialistFormData {
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  avatar_url: string;
}

interface SpecialistMetrics {
  chat_completion_rate: number;
  checkin_completion_rate: number;
  avg_user_rating: number;
  avg_streak_impact: number;
  avg_response_time_seconds: number;
  total_sessions: number;
  total_checkins: number;
  total_ratings: number;
}

const PeerSpecialistManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { specialistStatuses, analytics, loading: presenceLoading, refreshData } = useSpecialistPresence();
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);
  const [removedSpecialists, setRemovedSpecialists] = useState<PeerSpecialist[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'removed'>('active');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<PeerSpecialist | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [formData, setFormData] = useState<SpecialistFormData>({
    email: '',
    first_name: '',
    last_name: '',
    bio: '',
    specialties: [],
    years_experience: 0,
    avatar_url: ''
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [deletingSpecialistId, setDeletingSpecialistId] = useState<string | null>(null);
  const [credentialsDialog, setCredentialsDialog] = useState<{
    isOpen: boolean;
    email: string;
    password: string;
    specialistName: string;
  }>({
    isOpen: false,
    email: '',
    password: '',
    specialistName: ''
  });

  useEffect(() => {
    fetchSpecialists();
    fetchRemovedSpecialists();
  }, []);

  const fetchCoachingTips = async (specialistId: string): Promise<string[]> => {
    try {
      const { data: metrics } = await supabase
        .from('peer_monthly_metrics')
        .select('*')
        .eq('peer_id', specialistId)
        .order('month', { ascending: false })
        .limit(1);

      if (!metrics || metrics.length === 0) {
        return ["Focus on establishing consistent communication patterns with users"];
      }

      const latest = metrics[0];
      const tips: string[] = [];

      if (latest.chat_completion_rate < 80) {
        tips.push("Improve chat completion rates by setting clear session goals at the start");
      }
      if (latest.avg_user_rating < 4) {
        tips.push("Focus on active listening and empathy to improve user satisfaction");
      }
      if (latest.avg_response_time_seconds > 60) {
        tips.push("Aim for quicker response times to maintain user engagement");
      }
      if (latest.checkin_completion_rate < 90) {
        tips.push("Set regular reminders for user check-ins to improve completion rates");
      }

      return tips.length > 0 ? tips : ["Keep up the excellent work! Your performance metrics are strong"];
    } catch (error) {
      console.error('Error generating coaching tips:', error);
      return ["Focus on maintaining consistent communication with your assigned users"];
    }
  };

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched specialists with email data:', data);
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

  const fetchRemovedSpecialists = async () => {
    try {
      console.log('Fetching removed specialists...');
      const { data, error } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      console.log('Removed specialists data:', data);
      setRemovedSpecialists(data || []);
      console.log('Removed specialists state updated, count:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching removed specialists:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      bio: '',
      specialties: [],
      years_experience: 0,
      avatar_url: ''
    });
    setEditingSpecialist(null);
    setNewSpecialty('');
  };

  const handleInviteSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast({
        title: "Validation Error",
        description: "Email, first name, and last name are required",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Admin user not found",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsInviting(true);

      console.log('About to call send-specialist-invitation function with data:', {
        adminId: user.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        specialties: formData.specialties,
        years_experience: formData.years_experience,
        avatar_url: formData.avatar_url || null
      });

      // Call edge function to create specialist and send invitation
      const { data, error } = await supabase.functions.invoke('send-specialist-invitation', {
        body: {
          adminId: user.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null
        }
      });

      console.log('Function call result:', { data, error });

      if (error) {
        console.error('Edge function error details:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Specialist invitation sent successfully! They will receive an email with login credentials."
      });

      fetchSpecialists();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error inviting specialist:', error);
      toast({
        title: "Error",
        description: `Failed to invite specialist: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleEditSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSpecialist) return;

    try {
      // Debug: Check current user and admin status first
      console.log('Current user ID:', user?.id);
      console.log('Current user email:', user?.email);
      
      // Test admin access first
      const { data: adminTest, error: adminError } = await supabase.rpc('is_admin', { _user_id: user?.id });
      console.log('Admin check result:', { adminTest, adminError });
      
      if (!adminTest) {
        toast({
          title: "Permission Error",
          description: "You don't have admin permissions to update specialists",
          variant: "destructive"
        });
        return;
      }

      console.log('Updating specialist with data:', {
        id: editingSpecialist.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      const { data, error } = await supabase
        .from('peer_specialists')
        .update({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', editingSpecialist.id)
        .select(); // Add select to see what was updated

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Specialist updated successfully"
      });

      await fetchSpecialists(); // Refresh the list
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error updating specialist:', error);
      toast({
        title: "Error",
        description: `Failed to update specialist: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (specialist: PeerSpecialist) => {
    setEditingSpecialist(specialist);
    setFormData({
      email: specialist.email || '',
      first_name: specialist.first_name,
      last_name: specialist.last_name,
      bio: specialist.bio || '',
      specialties: specialist.specialties || [],
      years_experience: specialist.years_experience,
      avatar_url: specialist.avatar_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleForceActivate = async (specialist: PeerSpecialist) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Admin user not found",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      // Hash the password (simple approach for demo - in production use proper bcrypt)
      const tempPasswordHash = await hashPassword(tempPassword);
      
      const updateData = {
        is_verified: true,
        is_active: true,
        activated_at: new Date().toISOString(),
        activation_method: 'manual',
        manually_activated_by: user.id,
        temporary_password_hash: tempPasswordHash,
        must_change_password: true
      };

      const { error } = await supabase
        .from('peer_specialists')
        .update(updateData)
        .eq('id', specialist.id);

      if (error) throw error;
      
      // Use the stored email from the specialist record
      const specialistEmail = specialist.email || 'Email not available - contact admin';
      
      // Show credentials dialog
      setCredentialsDialog({
        isOpen: true,
        email: specialistEmail,
        password: tempPassword,
        specialistName: `${specialist.first_name} ${specialist.last_name}`
      });
      
      fetchSpecialists();
      toast({
        title: "Success",
        description: "Specialist manually activated. Temporary credentials generated."
      });
    } catch (error) {
      console.error('Error force activating specialist:', error);
      toast({
        title: "Error",
        description: "Failed to activate specialist",
        variant: "destructive"
      });
    }
  };

  // Helper function to generate temporary password
  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Simple password hashing (in production, use bcrypt)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const getInvitationStatus = (specialist: PeerSpecialist) => {
    if (specialist.activated_at) {
      const activationMethod = specialist.activation_method || 'email';
      const isManual = activationMethod === 'manual';
      return { 
        status: 'activated', 
        color: isManual ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400', 
        text: isManual ? 'Manual Activated' : 'Email Activated' 
      };
    }
    if (specialist.invitation_sent_at && !specialist.is_invitation_accepted) {
      const expiresAt = new Date(specialist.invitation_expires_at || '');
      const now = new Date();
      if (now > expiresAt) {
        return { status: 'expired', color: 'bg-red-500/20 text-red-400', text: 'Expired' };
      }
      return { status: 'pending', color: 'bg-yellow-500/20 text-yellow-400', text: 'Pending Email' };
    }
    return { status: 'not_sent', color: 'bg-gray-500/20 text-gray-400', text: 'Not Sent' };
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <UserPlus className="text-primary-foreground" size={24} />
            </div>
            <h1 className="font-fjalla font-bold text-primary text-2xl tracking-wide">PEER SPECIALIST MANAGEMENT</h1>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-sm">
                <Users className="text-primary-foreground" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-card-foreground">{specialists.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Active Specialists</div>
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

          <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-sm">
                <Clock className="text-primary-foreground" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-card-foreground">
                  {Math.round(analytics.reduce((sum, a) => sum + a.avg_response_time, 0) / Math.max(analytics.length, 1))}s
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Avg Response</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Add Specialist Section */}
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
                <Mail className="mr-2 h-4 w-4" />
                {editingSpecialist ? 'Edit Specialist' : 'Create & Invite Specialist'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-steel-dark border-steel">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingSpecialist ? 'Edit Specialist' : 'Create & Invite New Specialist'}
                </DialogTitle>
              </DialogHeader>

              {/* NEW ADMIN-CONTROLLED SPECIALIST ONBOARDING Card */}
              <Card className="bg-primary/10 border-primary/30 p-4 mb-4">
                <h4 className="font-fjalla font-bold text-primary text-lg tracking-wide mb-2">
                  NEW ADMIN-CONTROLLED SPECIALIST ONBOARDING
                </h4>
                <p className="text-sm text-muted-foreground mb-1">
                  1. Creates a peer support specialist account. An invitation email with temporary password will be sent.
                </p>
                <p className="text-sm text-muted-foreground">
                  2. The invited Peer Support Specialist clicks email verification link to activate account and access the portal.
                </p>
              </Card>
              
              <form onSubmit={editingSpecialist ? handleEditSpecialist : handleInviteSpecialist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address * 
                    {editingSpecialist && (
                      <span className="text-sm text-muted-foreground ml-2">(Login username)</span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="bg-steel border-steel-light text-white"
                    placeholder="specialist@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-white">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                      className="bg-steel border-steel-light text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-white">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                      className="bg-steel border-steel-light text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="bg-steel border-steel-light text-white"
                    placeholder="Brief description of experience and approach..."
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
                      placeholder="Add specialty (e.g. Addiction Recovery, Trauma)"
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
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isInviting}
                  >
                    {isInviting ? 'Processing...' : editingSpecialist ? 'Update Specialist' : 'Create & Send Invitation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Specialists List */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'removed')}>
          <TabsList className="bg-steel border-steel-light">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Active Specialists ({specialists.length})
            </TabsTrigger>
            <TabsTrigger value="removed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Removed Specialists ({removedSpecialists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-4">
              {specialists.map((specialist) => {
                const status = specialistStatuses.find(s => s.specialist_id === specialist.id);
                const invitationStatus = getInvitationStatus(specialist);
                
                return (
                  <Card key={specialist.id} className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-bold">
                              {specialist.first_name[0]}{specialist.last_name[0]}
                            </span>
                          </div>
                          {status?.status === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-bold text-card-foreground">
                              {specialist.first_name} {specialist.last_name}
                            </h3>
                            <Badge className={`${invitationStatus.color} border-0`}>
                              {invitationStatus.text}
                            </Badge>
                            {specialist.email && (
                              <Badge variant="outline" className="text-xs">
                                {specialist.email}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{specialist.years_experience} years experience</span>
                            {specialist.specialties && specialist.specialties.length > 0 && (
                              <span>• {specialist.specialties.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-2">
                          <Button
                            onClick={() => handleEdit(specialist)}
                            variant="outline"
                            size="sm"
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <Edit size={16} />
                          </Button>
                          
                          {!specialist.activated_at && (
                            <>
                              <Button
                                onClick={() => handleForceActivate(specialist)}
                                variant="outline"
                                size="sm"
                                className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                                title="Force activate without email verification"
                              >
                                <Check size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {specialists.length === 0 && (
                <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                  <p className="text-muted-foreground text-center">No active specialists found.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="removed">
            <div className="space-y-4">
              {removedSpecialists.map((specialist) => (
                <Card key={specialist.id} className="bg-card/50 p-6 rounded-lg border-0 shadow-none transition-colors duration-300 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-muted-foreground font-bold">
                          {specialist.first_name[0]}{specialist.last_name[0]}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-bold text-muted-foreground line-through">
                            {specialist.first_name} {specialist.last_name}
                          </h3>
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            Removed
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{specialist.years_experience} years experience</span>
                          {specialist.specialties && specialist.specialties.length > 0 && (
                            <span>• {specialist.specialties.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {removedSpecialists.length === 0 && (
                <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                  <p className="text-muted-foreground text-center">No removed specialists found.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialog.isOpen} onOpenChange={(open) => 
        setCredentialsDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Specialist Login Credentials
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Important</p>
                  <p className="text-warning/80">
                    Share these credentials securely with {credentialsDialog.specialistName}. 
                    They must change the password on first login.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Email (Username)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={credentialsDialog.email} 
                    readOnly 
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialsDialog.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Temporary Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={credentialsDialog.password} 
                    readOnly 
                    className="bg-muted font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialsDialog.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <div className="text-sm">
                <p className="font-medium text-info mb-2">Instructions for Specialist:</p>
                <ol className="list-decimal list-inside space-y-1 text-info/80">
                  <li>Go to the Peer Support Portal login page</li>
                  <li>Use the email and temporary password above</li>
                  <li>You'll be prompted to change your password</li>
                  <li>Create a strong, secure password</li>
                  <li>Complete your profile setup</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCredentialsDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function addSpecialty() {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  }

  function removeSpecialty(specialty: string) {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  }
};

export default PeerSpecialistManagement;
