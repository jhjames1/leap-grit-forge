import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSpecialistPresence } from '@/hooks/useSpecialistPresence';
import SpecialistPerformanceMetrics from './SpecialistPerformanceMetrics';
import CoachingTips from './CoachingTips';
import RealTimeSpecialistMetrics from './RealTimeSpecialistMetrics';
import PeerPerformanceDashboard from './PeerPerformanceDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, Edit, Check, X, Users, AlertCircle, Search, Activity, Clock, MessageSquare, TrendingUp, TrendingDown, Wifi, WifiOff, Mail, Send, Trash2, Star, RefreshCw, Key, Copy, Calendar, Loader2, AlertTriangle, MoreHorizontal, RotateCcw, UserCheck } from 'lucide-react';
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
  phone_number?: string;
}

interface SpecialistFormData {
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  avatar_url: string;
  phone_number?: string;
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
  const {
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    specialistStatuses,
    analytics,
    loading: presenceLoading,
    refreshData
  } = useSpecialistPresence();
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);
  const [removedSpecialists, setRemovedSpecialists] = useState<PeerSpecialist[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'removed'>('active');
  const [groupMetricsTimePeriod, setGroupMetricsTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
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
    avatar_url: '',
    phone_number: ''
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
  const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null);
  useEffect(() => {
    fetchSpecialists();
    fetchRemovedSpecialists();
  }, []);
  const fetchCoachingTips = async (specialistId: string): Promise<string[]> => {
    try {
      const {
        data: metrics
      } = await supabase.from('peer_monthly_metrics').select('*').eq('peer_id', specialistId).order('month', {
        ascending: false
      }).limit(1);
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
      const {
        data,
        error
      } = await supabase.from('peer_specialists').select('*').eq('is_active', true).order('created_at', {
        ascending: false
      });
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
      const {
        data,
        error
      } = await supabase.from('peer_specialists').select('*').eq('is_active', false).order('updated_at', {
        ascending: false
      });
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
      avatar_url: '',
      phone_number: ''
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
      const {
        data,
        error
      } = await supabase.functions.invoke('send-specialist-invitation', {
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
      console.log('Function call result:', {
        data,
        error
      });
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

      // Check auth session status
      const {
        data: session
      } = await supabase.auth.getSession();
      console.log('Current session:', session?.session?.user?.id, session?.session?.user?.email);

      // Test admin access first
      const {
        data: adminTest,
        error: adminError
      } = await supabase.rpc('is_admin', {
        _user_id: user?.id
      });
      console.log('Admin check result:', {
        adminTest,
        adminError
      });
      if (!adminTest) {
        toast({
          title: "Permission Error",
          description: "You don't have admin permissions to update specialists",
          variant: "destructive"
        });
        return;
      }

      // Additional debug: Test direct auth context
      const {
        data: debugAuth
      } = await supabase.rpc('debug_auth_context');
      console.log('Auth context debug:', debugAuth);
      console.log('Updating specialist with data:', {
        id: editingSpecialist.id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      const {
        data,
        error
      } = await supabase.from('peer_specialists').update({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        specialties: formData.specialties,
        years_experience: formData.years_experience,
        avatar_url: formData.avatar_url || null
      }).eq('id', editingSpecialist.id).select();
      console.log('Update result:', {
        data,
        error
      });
      if (error) {
        console.error('Update error details:', error);
        throw error;
      }
      toast({
        title: "Success",
        description: "Specialist updated successfully"
      });
      await fetchSpecialists();
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
      avatar_url: specialist.avatar_url || '',
      phone_number: specialist.phone_number || ''
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
      const tempPassword = generateTempPassword();
      const tempPasswordHash = await hashPassword(tempPassword);

      // First, update the specialist record
      const updateData = {
        is_verified: true,
        is_active: true,
        activated_at: new Date().toISOString(),
        activation_method: 'manual',
        manually_activated_by: user.id,
        temporary_password_hash: tempPasswordHash,
        must_change_password: true
      };
      const {
        error: updateError
      } = await supabase.from('peer_specialists').update(updateData).eq('id', specialist.id);
      if (updateError) throw updateError;

      // Now update the actual auth user's password using an edge function
      const {
        data: authUpdateResult,
        error: authError
      } = await supabase.functions.invoke('update-specialist-password', {
        body: {
          userId: specialist.user_id,
          newPassword: tempPassword,
          adminId: user.id
        }
      });
      if (authError) {
        console.error('Error updating auth password:', authError);
        // Don't fail completely, but warn the admin
        toast({
          title: "Partial Success",
          description: "Specialist activated but password update failed. Please use 'Reset Password' or contact admin.",
          variant: "destructive"
        });
      } else if (!authUpdateResult?.success) {
        console.error('Auth password update failed:', authUpdateResult);
        toast({
          title: "Partial Success",
          description: "Specialist activated but password update failed. Please use 'Reset Password' or contact admin.",
          variant: "destructive"
        });
      }
      const specialistEmail = specialist.email || 'Email not available - contact admin';
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
  const handleResetPassword = async (specialist: PeerSpecialist) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Admin user not found",
        variant: "destructive"
      });
      return;
    }
    setIsResettingPassword(specialist.id);
    try {
      const tempPassword = generateTempPassword();

      // Call the edge function to update the specialist's password
      const {
        data: authUpdateResult,
        error: authError
      } = await supabase.functions.invoke('update-specialist-password', {
        body: {
          userId: specialist.user_id,
          newPassword: tempPassword,
          adminId: user.id
        }
      });
      if (authError) {
        console.error('Error updating auth password:', authError);
        throw new Error(`Password update failed: ${authError.message}`);
      }
      if (!authUpdateResult?.success) {
        console.error('Auth password update failed:', authUpdateResult);
        throw new Error(authUpdateResult?.error || 'Password update failed');
      }

      // Update the specialist record to require password change
      const {
        error: updateError
      } = await supabase.from('peer_specialists').update({
        must_change_password: true,
        updated_at: new Date().toISOString()
      }).eq('id', specialist.id);
      if (updateError) {
        console.error('Error updating specialist record:', updateError);
        // Don't fail completely, password was already reset
        toast({
          title: "Partial Success",
          description: "Password reset but database update failed. Password change will still be required.",
          variant: "destructive"
        });
      }

      // Show the new credentials
      const specialistEmail = specialist.email || 'Email not available - contact admin';
      setCredentialsDialog({
        isOpen: true,
        email: specialistEmail,
        password: tempPassword,
        specialistName: `${specialist.first_name} ${specialist.last_name}`
      });
      toast({
        title: "Success",
        description: "Password reset successfully. Temporary credentials generated."
      });
      fetchSpecialists();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: `Failed to reset password: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(null);
    }
  };
  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
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
        return {
          status: 'expired',
          color: 'bg-red-500/20 text-red-400',
          text: 'Expired'
        };
      }
      return {
        status: 'pending',
        color: 'bg-yellow-500/20 text-yellow-400',
        text: 'Pending Email'
      };
    }
    return {
      status: 'not_sent',
      color: 'bg-gray-500/20 text-gray-400',
      text: 'Not Sent'
    };
  };
  const handleDeactivateSpecialist = async (specialistId: string) => {
    setDeletingSpecialistId(specialistId);
    try {
      const {
        data,
        error
      } = await supabase.rpc('soft_delete_specialist', {
        specialist_id: specialistId
      });
      if (error) throw error;
      const result = data as any;
      if (result.success) {
        toast({
          title: "Success",
          description: "Specialist has been deactivated"
        });
        await fetchSpecialists();
        await fetchRemovedSpecialists();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deactivating specialist:', error);
      toast({
        title: "Error",
        description: `Failed to deactivate specialist: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setDeletingSpecialistId(null);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };
  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const getOnlineStatus = (specialistId: string) => {
    const status = specialistStatuses[specialistId];
    if (!status) return {
      color: 'bg-gray-500',
      text: 'Unknown'
    };
    switch (status.status) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Online'
        };
      case 'busy':
        return {
          color: 'bg-yellow-500',
          text: 'Busy'
        };
      case 'away':
        return {
          color: 'bg-orange-500',
          text: 'Away'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Offline'
        };
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  const handleDashboardRefresh = () => {
    setDashboardRefreshTrigger(prev => prev + 1);
    refreshData();
  };
  return <div className="space-y-6">
      

      

      <Card>
        
        
      </Card>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'active' | 'removed')}>
        <TabsList className="bg-transparent border-0 gap-2 justify-start px-6">
          <TabsTrigger value="active" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50 data-[state=active]:scale-125 transition-transform duration-200 px-6 py-2 border border-gray-300 data-[state=active]:border-yellow-400">
            <Users className="mr-2 h-4 w-4" />
            Active Specialists
          </TabsTrigger>
          <TabsTrigger value="removed" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-50 data-[state=active]:scale-125 transition-transform duration-200 px-6 py-2 border border-gray-300 data-[state=active]:border-yellow-400">
            <AlertCircle className="mr-2 h-4 w-4" />
            Removed Specialists ({removedSpecialists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Specialists</CardTitle>
            </CardHeader>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSpecialist ? 'Edit Specialist' : 'Invite New Specialist'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={editingSpecialist ? handleEditSpecialist : handleInviteSpecialist} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                      ...formData,
                      email: e.target.value
                    })} required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" value={formData.phone_number || ''} onChange={e => setFormData({
                      ...formData,
                      phone_number: e.target.value
                    })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" value={formData.first_name} onChange={e => setFormData({
                      ...formData,
                      first_name: e.target.value
                    })} required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" value={formData.last_name} onChange={e => setFormData({
                      ...formData,
                      last_name: e.target.value
                    })} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" value={formData.bio} onChange={e => setFormData({
                    ...formData,
                    bio: e.target.value
                  })} />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" value={formData.years_experience} onChange={e => setFormData({
                    ...formData,
                    years_experience: parseInt(e.target.value) || 0
                  })} />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input id="avatar" type="url" value={formData.avatar_url || ''} onChange={e => setFormData({
                    ...formData,
                    avatar_url: e.target.value
                  })} />
                  </div>
                  <div>
                    <Label>Specialties</Label>
                    <div className="flex items-center gap-2 mb-2">
                      <Input placeholder="Add specialty" value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(),
                      addSpecialty())} />
                      <Button type="button" onClick={addSpecialty} size="sm">
                        Add
                       </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {specialty}
                          <button type="button" onClick={() => removeSpecialty(specialty)} className="ml-1 hover:text-destructive">
                            ×
                          </button>
                        </Badge>)}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </> : editingSpecialist ? 'Update Specialist' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <CardContent>
              <div className="space-y-4">
                {specialists.map((specialist) => (
                  <div key={specialist.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {specialist.avatar_url && (
                        <img
                          src={specialist.avatar_url}
                          alt={`${specialist.first_name} ${specialist.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {specialist.first_name} {specialist.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{specialist.email}</p>
                        {specialist.phone_number && (
                          <p className="text-sm text-muted-foreground">{specialist.phone_number}</p>
                        )}
                        {specialist.specialties && specialist.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {specialist.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={specialist.is_verified ? "default" : "secondary"}>
                        {specialist.is_verified ? "Verified" : "Pending"}
                      </Badge>
                      <Badge variant={specialist.is_active ? "default" : "destructive"}>
                        {specialist.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                      onClick={() => handleEdit(specialist)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                {specialists.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No active specialists found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="removed" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Specialists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {removedSpecialists.map((specialist) => (
                  <div key={specialist.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-4">
                      {specialist.avatar_url && (
                        <img
                          src={specialist.avatar_url}
                          alt={`${specialist.first_name} ${specialist.last_name}`}
                          className="w-10 h-10 rounded-full object-cover opacity-50"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-muted-foreground">
                          {specialist.first_name} {specialist.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{specialist.email}</p>
                        {specialist.phone_number && (
                          <p className="text-sm text-muted-foreground">{specialist.phone_number}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Inactive</Badge>
                    </div>
                  </div>
                ))}
                {removedSpecialists.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No inactive specialists found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialog.isOpen} onOpenChange={(open) => setCredentialsDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Credentials Generated</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Temporary login credentials for {credentialsDialog.specialistName}:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">Email: {credentialsDialog.email}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(credentialsDialog.email)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">Password: {credentialsDialog.password}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(credentialsDialog.password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Share these credentials securely with the specialist. They will be required to change their password on first login.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeerSpecialistManagement;