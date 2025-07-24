import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Edit, Check, X, Users, AlertCircle, Search, Activity, Clock, MessageSquare, TrendingUp, TrendingDown, Wifi, WifiOff, Mail, Send, Trash2, Star, RefreshCw, Key, Copy, Calendar, Loader2, AlertTriangle, MoreHorizontal, RotateCcw, UserCheck, UserX } from 'lucide-react';
interface PeerSpecialist {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  bio: string | null;
  specialties: string[] | null;
  years_experience: number;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  phone_number?: string;
  invitation_sent_at?: string;
  invitation_expires_at?: string;
  must_change_password?: boolean | null;
  activated_at?: string | null;
  activation_method?: string | null;
  manually_activated_by?: string | null;
  // Optional fields that may exist in database
  calendar_availability?: any;
  timezone?: string | null;
  hourly_rate?: number | null;
  education?: string | null;
  certifications?: string[] | null;
  languages?: string[] | null;
  availability_status?: string | null;
  max_sessions_per_day?: number | null;
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
const PeerSpecialistManagement = () => {
  const [specialists, setSpecialists] = useState<PeerSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSpecialist, setEditingSpecialist] = useState<PeerSpecialist | null>(null);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [deletingSpecialist, setDeletingSpecialist] = useState<string | null>(null);
  const [credentialsDialog, setCredentialsDialog] = useState({
    isOpen: false,
    specialistName: '',
    email: '',
    password: ''
  });
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
  const {
    toast
  } = useToast();
  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('peer_specialists').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setSpecialists(data || []);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch specialists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSpecialists();
  }, []);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard"
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
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
    setIsInviting(true);
    try {
      const response = await fetch('/api/send-specialist-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          specialties: formData.specialties.length > 0 ? formData.specialties : null
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      const data = await response.json();
      if (data.credentials) {
        setCredentialsDialog({
          isOpen: true,
          specialistName: `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          password: data.credentials.password
        });
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
    setIsInviting(true);
    try {
      const {
        error
      } = await supabase.from('peer_specialists').update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        specialties: formData.specialties.length > 0 ? formData.specialties : null,
        years_experience: formData.years_experience,
        avatar_url: formData.avatar_url || null,
        phone_number: formData.phone_number || null
      }).eq('id', editingSpecialist.id);
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
        description: `Failed to update specialist: ${error?.message || 'Unknown error'}`,
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
      avatar_url: specialist.avatar_url || '',
      phone_number: specialist.phone_number || ''
    });
    setIsDialogOpen(true);
  };
  const handleVerifySpecialist = async (specialistId: string) => {
    try {
      const specialist = specialists.find(s => s.id === specialistId);
      if (!specialist) return;
      const {
        error
      } = await supabase.from('peer_specialists').update({
        is_verified: !specialist.is_verified
      }).eq('id', specialistId);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Specialist ${specialist.is_verified ? 'unverified' : 'verified'} successfully`
      });
      fetchSpecialists();
    } catch (error) {
      console.error('Error updating specialist verification:', error);
      toast({
        title: "Error",
        description: "Failed to update specialist verification",
        variant: "destructive"
      });
    }
  };
  const handleResetPassword = async (specialistId: string) => {
    try {
      const response = await fetch('/api/update-specialist-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          specialistId,
          action: 'reset'
        })
      });
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      const data = await response.json();
      if (data.credentials) {
        const specialist = specialists.find(s => s.id === specialistId);
        setCredentialsDialog({
          isOpen: true,
          specialistName: specialist ? `${specialist.first_name} ${specialist.last_name}` : 'Specialist',
          email: specialist?.email || '',
          password: data.credentials.password
        });
      }
      toast({
        title: "Success",
        description: "Password reset successfully. New credentials generated."
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };
  const handleSoftDeleteSpecialist = async (specialistId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('soft_delete_specialist', {
        specialist_id: specialistId
      });
      if (error) throw error;
      const result = data as {
        success?: boolean;
        error?: string;
      } | null;
      if (result?.success) {
        toast({
          title: "Success",
          description: "Specialist deactivated successfully"
        });
        fetchSpecialists();
      } else {
        throw new Error(result?.error || 'Failed to deactivate specialist');
      }
    } catch (error) {
      console.error('Error deactivating specialist:', error);
      toast({
        title: "Error",
        description: `Failed to deactivate specialist: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setDeletingSpecialist(null);
    }
  };
  const handleReactivateSpecialist = async (specialistId: string) => {
    try {
      const {
        error
      } = await supabase.from('peer_specialists').update({
        is_active: true,
        is_verified: true
      }).eq('id', specialistId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Specialist reactivated successfully"
      });
      fetchSpecialists();
    } catch (error) {
      console.error('Error reactivating specialist:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate specialist",
        variant: "destructive"
      });
    }
  };
  const filteredSpecialists = specialists.filter(specialist => `${specialist.first_name} ${specialist.last_name} ${specialist.email}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeSpecialists = filteredSpecialists.filter(s => s.is_active);
  const removedSpecialists = filteredSpecialists.filter(s => !s.is_active);
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return;
};
export default PeerSpecialistManagement;