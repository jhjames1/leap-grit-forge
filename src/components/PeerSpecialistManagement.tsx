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
  RefreshCw
} from 'lucide-react';

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
  invitation_token: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  is_invitation_accepted: boolean | null;
  must_change_password: boolean | null;
  activated_at: string | null;
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
  const [specialistMetrics, setSpecialistMetrics] = useState<{[key: string]: SpecialistMetrics}>({});
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

  useEffect(() => {
    fetchSpecialists();
    fetchRemovedSpecialists();
  }, []);

  useEffect(() => {
    if (specialists.length > 0) {
      fetchSpecialistMetrics();
    }
  }, [specialists]);

  const fetchSpecialistMetrics = async () => {
    try {
      const metricsData: {[key: string]: SpecialistMetrics} = {};

      for (const specialist of specialists) {
        // Calculate live metrics for each specialist
        
        // Chat Sessions
        const { data: chatSessions } = await supabase
          .from('chat_sessions')
          .select('id, status')
          .eq('specialist_id', specialist.id);

        // Check-ins
        const { data: checkins } = await supabase
          .from('peer_checkins')
          .select('id, status')
          .eq('peer_id', specialist.id);

        // Ratings
        const { data: ratings } = await supabase
          .from('peer_session_ratings')
          .select('rating')
          .eq('peer_id', specialist.id);

        const totalSessions = chatSessions?.length || 0;
        const completedSessions = chatSessions?.filter(s => s.status === 'ended').length || 0;
        const chatCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

        const totalCheckins = checkins?.length || 0;
        const completedCheckins = checkins?.filter(c => c.status === 'completed').length || 0;
        const checkinCompletionRate = totalCheckins > 0 ? (completedCheckins / totalCheckins) * 100 : 0;

        const totalRatings = ratings?.length || 0;
        const avgUserRating = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
          : 0;

        metricsData[specialist.id] = {
          chat_completion_rate: Math.round(chatCompletionRate * 10) / 10,
          checkin_completion_rate: Math.round(checkinCompletionRate * 10) / 10,
          avg_user_rating: Math.round(avgUserRating * 10) / 10,
          avg_streak_impact: 0, // Placeholder
          avg_response_time_seconds: 30 + Math.random() * 60, // Placeholder
          total_sessions: totalSessions,
          total_checkins: totalCheckins,
          total_ratings: totalRatings,
        };
      }

      setSpecialistMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching specialist metrics:', error);
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

  const getMetricColor = (value: number | undefined, threshold: number, isReversed = false): string => {
    if (value === undefined || value === null) return 'text-muted-foreground';
    
    if (isReversed) {
      return value <= threshold ? 'text-success' : 'text-destructive';
    }
    return value >= threshold ? 'text-success' : 'text-destructive';
  };

  const formatResponseTime = (seconds: number | undefined): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
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
      const { error } = await supabase
        .from('peer_specialists')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', editingSpecialist.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Specialist updated successfully"
      });

      fetchSpecialists();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating specialist:', error);
      toast({
        title: "Error",
        description: "Failed to update specialist",
        variant: "destructive"
      });
    }
  };

  const handleResendInvitation = async (specialist: PeerSpecialist) => {
    try {
      setIsInviting(true);

      const { error } = await supabase.functions.invoke('send-specialist-invitation', {
        body: {
          specialistId: specialist.id,
          adminId: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation email resent successfully"
      });

      fetchSpecialists();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleEdit = (specialist: PeerSpecialist) => {
    setEditingSpecialist(specialist);
    setFormData({
      email: '', // Email can't be changed
      first_name: specialist.first_name,
      last_name: specialist.last_name,
      bio: specialist.bio || '',
      specialties: specialist.specialties || [],
      years_experience: specialist.years_experience,
      avatar_url: specialist.avatar_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleSoftDelete = async (specialist: PeerSpecialist) => {
    try {
      console.log('Starting soft delete for specialist:', specialist.id);
      
      // First, test the debug function to see what's happening in the database context
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_auth_context');
      
      console.log('Debug auth context:', debugData, 'Error:', debugError);
      
      // Use the security definer function to bypass RLS issues
      const { data, error } = await supabase.rpc('soft_delete_specialist', {
        specialist_id: specialist.id
      });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      // Type the response properly
      const response = data as { success: boolean; error?: string; message?: string };
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to deactivate specialist');
      }

      console.log('Update result:', response);

      console.log('Specialist soft deleted successfully, refreshing lists...');

      toast({
        title: "Specialist moved to removed",
        description: "Specialist has been moved to the Removed tab while preserving their history",
      });

      // Refresh both lists to update the UI
      await Promise.all([
        fetchSpecialists(),
        fetchRemovedSpecialists()
      ]);
      
      console.log('Lists refreshed after soft delete');
    } catch (error) {
      console.error('Error deactivating specialist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate specialist';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStatusToggle = async (specialist: PeerSpecialist, field: 'is_active' | 'is_verified') => {
    try {
      let updateData: any = {};
      
      if (field === 'is_active') {
        // Can only activate if verified
        if (!specialist.is_verified) {
          toast({
            title: "Cannot activate specialist",
            description: "Specialist must be verified before they can be activated",
            variant: "destructive"
          });
          return;
        }
        updateData.is_active = !specialist.is_active;
      } else if (field === 'is_verified') {
        updateData.is_verified = !specialist.is_verified;
        
        // If unverifying, also deactivate
        if (specialist.is_verified) {
          updateData.is_active = false;
        }
      }

      const { error } = await supabase
        .from('peer_specialists')
        .update(updateData)
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

  const getInvitationStatus = (specialist: PeerSpecialist) => {
    if (specialist.activated_at) {
      return { status: 'activated', color: 'bg-green-500/20 text-green-400', text: 'Activated' };
    }
    if (specialist.invitation_sent_at && !specialist.is_invitation_accepted) {
      const expiresAt = new Date(specialist.invitation_expires_at || '');
      const now = new Date();
      if (now > expiresAt) {
        return { status: 'expired', color: 'bg-red-500/20 text-red-400', text: 'Expired' };
      }
      return { status: 'pending', color: 'bg-yellow-500/20 text-yellow-400', text: 'Pending' };
    }
    return { status: 'not_sent', color: 'bg-gray-500/20 text-gray-400', text: 'Not Sent' };
  };

  const handlePermanentDelete = async (specialist: PeerSpecialist) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETION WARNING ⚠️\n\n` +
      `This will PERMANENTLY DELETE:\n` +
      `• ${specialist.first_name} ${specialist.last_name}'s specialist profile\n` +
      `• All their schedules and content views\n` +
      `• Their specialist status records\n\n` +
      `Chat sessions will be preserved but anonymized.\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type "DELETE" to confirm this permanent deletion.`
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = prompt(
      `Final confirmation required.\n\nType "DELETE" exactly to permanently delete ${specialist.first_name} ${specialist.last_name}:`
    );

    if (doubleConfirm !== 'DELETE') {
      toast({
        title: "Deletion cancelled",
        description: "Permanent deletion was cancelled",
      });
      return;
    }

    try {
      setDeletingSpecialistId(specialist.id);

      console.log('Attempting to permanently delete specialist:', specialist.id);

      // Call the edge function to permanently delete the specialist
      const { data, error } = await supabase.functions.invoke('permanently-delete-specialist', {
        body: {
          specialistId: specialist.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to permanently delete specialist');
      }

      console.log('Specialist permanently deleted successfully');

      toast({
        title: "Specialist permanently deleted",
        description: `${specialist.first_name} ${specialist.last_name} has been permanently removed from the system`,
      });

      // Refresh the removed specialists list
      await fetchRemovedSpecialists();

    } catch (error) {
      console.error('Error permanently deleting specialist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete specialist';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeletingSpecialistId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Peer Specialist Management</h2>
          <Button
            onClick={() => {
              fetchSpecialists();
              fetchSpecialistMetrics();
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
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

      {/* New Workflow Instructions */}
      <Card className="bg-blue-50 p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
        <div className="flex items-start space-x-3">
          <div className="bg-primary p-3 rounded-sm">
            <Mail className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h3 className="text-black font-fjalla font-bold mb-2 tracking-wide text-lg">NEW ADMIN-CONTROLLED SPECIALIST ONBOARDING</h3>
            <p className="text-black text-sm font-source">
              1. Admin creates specialist account and sends invitation email with temporary password
              <br />
              2. Specialist receives email with login credentials and verification link
              <br />
              3. Specialist clicks verification link to activate account and access the portal
              <br />
              4. Specialist must change password on first login for security
            </p>
          </div>
        </div>
      </Card>

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
            
            <form onSubmit={editingSpecialist ? handleEditSpecialist : handleInviteSpecialist} className="space-y-4">
              {!editingSpecialist && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
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
              )}

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
                  className="bg-construction text-midnight hover:bg-construction/90"
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-midnight border-t-transparent"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {editingSpecialist ? 'Update' : 'Create & Send Invitation'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Specialists List with Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'removed')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="text-foreground">
            Active Specialists ({specialists.length})
          </TabsTrigger>
          <TabsTrigger value="removed" className="text-foreground">
            Removed Specialists ({removedSpecialists.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {loading ? (
            <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
              <p className="text-muted-foreground text-center">Loading specialists...</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {specialists.map((specialist) => {
                const status = getSpecialistStatus(specialist.id);
                const analyticsData = getSpecialistAnalytics(specialist.id);
                const invitationStatus = getInvitationStatus(specialist);
                const metrics = specialistMetrics[specialist.id];
                
                return (
                  <Card key={specialist.id} className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
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
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-fjalla font-bold text-card-foreground text-lg tracking-wide">
                              {specialist.first_name} {specialist.last_name}
                            </h3>
                            
                            {/* Invitation Status */}
                            <Badge className={`${invitationStatus.color} text-xs uppercase font-oswald tracking-wide`}>
                              {invitationStatus.text}
                            </Badge>
                            
                            {/* Real-time status */}
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
                          
                          {specialist.specialties && specialist.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {specialist.specialties.map((specialty, index) => (
                                <Badge key={index} className="bg-primary/20 text-primary border-primary/30 text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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

                          {/* Performance Metrics & Coaching Tips */}
                          {metrics && (
                            <div className="pt-4 border-t border-muted/30">
                              <h4 className="text-sm font-medium mb-3">Performance Metrics & Coaching</h4>
                              
                              {/* Performance Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-bold">Chat Completion</p>
                                  <div className={`text-lg font-bold ${getMetricColor(metrics.chat_completion_rate, 75)}`}>
                                    {metrics.chat_completion_rate?.toFixed(1) || '0.0'}%
                                  </div>
                                  <p className="text-xs text-muted-foreground">Target ≥ 75%</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs font-bold">Check-in Rate</p>
                                  <div className={`text-lg font-bold ${getMetricColor(metrics.checkin_completion_rate, 75)}`}>
                                    {metrics.checkin_completion_rate?.toFixed(1) || '0.0'}%
                                  </div>
                                  <p className="text-xs text-muted-foreground">Target ≥ 75%</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs font-bold">User Rating</p>
                                  <div className={`text-lg font-bold ${getMetricColor(metrics.avg_user_rating, 4.5)} flex items-center gap-1`}>
                                    <Star className="h-4 w-4 fill-current" />
                                    {metrics.avg_user_rating?.toFixed(1) || '0.0'}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Target ≥ 4.5★</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs font-bold">Streak Impact</p>
                                  <div className={`text-lg font-bold ${getMetricColor(metrics.avg_streak_impact, 1)} flex items-center gap-1`}>
                                    {(metrics.avg_streak_impact || 0) >= 0 ? (
                                      <TrendingUp className="h-4 w-4" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4" />
                                    )}
                                    {(metrics.avg_streak_impact || 0) >= 0 ? '+' : ''}{metrics.avg_streak_impact?.toFixed(1) || '0.0'}d
                                  </div>
                                  <p className="text-xs text-muted-foreground">Target ≥ +1d</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs font-bold">Response Time</p>
                                  <div className={`text-lg font-bold ${getMetricColor(metrics.avg_response_time_seconds, 45, true)} flex items-center gap-1`}>
                                    <Clock className="h-4 w-4" />
                                    {formatResponseTime(metrics.avg_response_time_seconds)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Target ≤ 45s</p>
                                </div>
                              </div>

                              {/* Performance Alerts & Coaching */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Performance Alerts */}
                                <div>
                                  <h5 className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Performance Alerts
                                  </h5>
                                  <div className="space-y-1">
                                    {(metrics.chat_completion_rate || 0) < 75 && (
                                      <Badge variant="destructive" className="text-xs mr-1 mb-1">
                                        Chat: {(metrics.chat_completion_rate || 0).toFixed(1)}%
                                      </Badge>
                                    )}
                                    {(metrics.checkin_completion_rate || 0) < 75 && (
                                      <Badge variant="destructive" className="text-xs mr-1 mb-1">
                                        Check-in: {(metrics.checkin_completion_rate || 0).toFixed(1)}%
                                      </Badge>
                                    )}
                                    {(metrics.avg_response_time_seconds || 0) > 45 && (
                                      <Badge variant="destructive" className="text-xs mr-1 mb-1">
                                        Response: {formatResponseTime(metrics.avg_response_time_seconds)}
                                      </Badge>
                                    )}
                                    {(metrics.avg_user_rating || 0) < 4.5 && (
                                      <Badge variant="destructive" className="text-xs mr-1 mb-1">
                                        Rating: {(metrics.avg_user_rating || 0).toFixed(1)}★
                                      </Badge>
                                    )}
                                    {(metrics.avg_streak_impact || 0) < 1 && (
                                      <Badge variant="destructive" className="text-xs mr-1 mb-1">
                                        Streak: {(metrics.avg_streak_impact || 0).toFixed(1)}d
                                      </Badge>
                                    )}
                                    {(metrics.chat_completion_rate || 0) >= 75 && 
                                     (metrics.checkin_completion_rate || 0) >= 75 &&
                                     (metrics.avg_response_time_seconds || 0) <= 45 &&
                                     (metrics.avg_user_rating || 0) >= 4.5 &&
                                     (metrics.avg_streak_impact || 0) >= 1 && (
                                      <p className="text-xs text-muted-foreground">All metrics on target ✓</p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Coaching Tips */}
                                <div>
                                  <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Coaching Tips
                                  </h5>
                                  <div className="space-y-1">
                                    {(metrics.chat_completion_rate || 0) < 75 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Focus on session engagement and follow-through
                                      </div>
                                    )}
                                    {(metrics.checkin_completion_rate || 0) < 75 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Improve scheduling adherence and time management
                                      </div>
                                    )}
                                    {(metrics.avg_response_time_seconds || 0) > 45 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Practice quicker responses and use templates
                                      </div>
                                    )}
                                    {(metrics.avg_user_rating || 0) < 4.5 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Focus on active listening and empathy
                                      </div>
                                    )}
                                    {(metrics.avg_streak_impact || 0) < 1 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Incorporate goal-setting techniques
                                      </div>
                                    )}
                                    {(metrics.chat_completion_rate || 0) >= 75 && 
                                     (metrics.checkin_completion_rate || 0) >= 75 &&
                                     (metrics.avg_response_time_seconds || 0) <= 45 &&
                                     (metrics.avg_user_rating || 0) >= 4.5 &&
                                     (metrics.avg_streak_impact || 0) >= 1 && (
                                      <div className="text-xs bg-muted/50 rounded p-2">
                                        Excellent performance! Continue maintaining these standards.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Performance Metrics */}
                          <div className="mt-4 pt-4 border-t border-muted/30">
                            <SpecialistPerformanceMetrics specialistId={specialist.id} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={specialist.is_active}
                              onCheckedChange={() => handleStatusToggle(specialist, 'is_active')}
                              disabled={!specialist.is_verified}
                              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted scale-75"
                            />
                            <span className={`text-xs ${specialist.is_verified ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                              Active {!specialist.is_verified && '(requires verification)'}
                            </span>
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
                            <Button
                              onClick={() => handleResendInvitation(specialist)}
                              variant="outline"
                              size="sm"
                              className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                              disabled={isInviting}
                            >
                              <Send size={16} />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleSoftDelete(specialist)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            title="Move to removed tab while preserving history"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {specialists.length === 0 && (
                <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                  <p className="text-muted-foreground text-center">No active specialists found. Create and invite your first specialist to get started.</p>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="removed" className="mt-6">
          <div className="space-y-4">
            {removedSpecialists.map((specialist) => {
              const invitationStatus = getInvitationStatus(specialist);
              
              return (
                <Card key={specialist.id} className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-muted p-3 rounded-sm">
                          {specialist.avatar_url ? (
                            <img 
                              src={specialist.avatar_url} 
                              alt={`${specialist.first_name} ${specialist.last_name}`}
                              className="w-8 h-8 rounded object-cover grayscale"
                            />
                          ) : (
                            <Users className="text-muted-foreground" size={20} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-fjalla font-bold text-muted-foreground text-lg tracking-wide">
                              {specialist.first_name} {specialist.last_name}
                            </h3>
                            
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs uppercase font-oswald tracking-wide">
                              REMOVED
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mb-2">
                            {specialist.years_experience} years experience
                          </p>
                          
                          {specialist.bio && (
                            <p className="text-muted-foreground text-sm mb-3 max-w-2xl">
                              {specialist.bio}
                            </p>
                          )}
                          
                          {specialist.specialties && specialist.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {specialist.specialties.map((specialty, index) => (
                                <Badge key={index} className="bg-muted/20 text-muted-foreground border-muted/30 text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Removed on: {new Date(specialist.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Button
                          onClick={() => handlePermanentDelete(specialist)}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-500 hover:bg-red-500/10 min-w-[40px] bg-background"
                          disabled={deletingSpecialistId === specialist.id}
                          title="Permanently delete this specialist and all their data"
                        >
                          {deletingSpecialistId === specialist.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                </Card>
              );
            })}
            
            {removedSpecialists.length === 0 && (
              <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
                <p className="text-muted-foreground text-center">No removed specialists found.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PeerSpecialistManagement;
