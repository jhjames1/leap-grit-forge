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

    // Debug: Check current user and admin status
    console.log('Current user:', user?.id);
    console.log('Editing specialist:', editingSpecialist.id);
    console.log('Form data:', formData);

    // Test admin access
    const { data: adminTest, error: adminError } = await supabase.rpc('is_admin', { _user_id: user?.id });
    console.log('Admin check:', { adminTest, adminError });

    console.log('Updating specialist with data:', {
      id: editingSpecialist.id,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name
    });

    try {
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
    } catch (error) {
      console.error('Error updating specialist:', error);
      toast({
        title: "Error",
        description: `Failed to update specialist: ${error.message}`,
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
        
        // Set activated_at when activating
        if (!specialist.is_active) {
          updateData.activated_at = new Date().toISOString();
        }
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
      
      // Debug: Check what email data we have
      console.log('Specialist data for force activation:', {
        id: specialist.id,
        email: specialist.email,
        first_name: specialist.first_name,
        last_name: specialist.last_name
      });
      
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
                          
                          {/* Current Activity Stats */}
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

                          {/* Replace the old performance metrics section with the new real-time component */}
                          <div className="pt-4 border-t border-muted/30">
                            <RealTimeSpecialistMetrics specialistId={specialist.id} />
                          </div>

                          {/* Coaching Tips */}
                          <CoachingTips specialistId={specialist.id} />
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
                            <>
                              <Button
                                onClick={() => handleResendInvitation(specialist)}
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                                disabled={isInviting}
                                title="Resend invitation email"
                              >
                                <Send size={16} />
                              </Button>
                              
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
};

export default PeerSpecialistManagement;
