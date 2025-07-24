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
import { UserPlus, Edit, Check, X, Users, AlertCircle, Search, Activity, Clock, MessageSquare, TrendingUp, TrendingDown, Wifi, WifiOff, Mail, Send, Trash2, Star, RefreshCw, Key, Copy, Calendar, Loader2, AlertTriangle, MoreHorizontal, RotateCcw, UserCheck } from 'lucide-react';

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

  const { toast } = useToast();

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
        description: "Text copied to clipboard",
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
      const { error } = await supabase
        .from('peer_specialists')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties.length > 0 ? formData.specialties : null,
          years_experience: formData.years_experience,
          avatar_url: formData.avatar_url || null,
          phone_number: formData.phone_number || null
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

      const { error } = await supabase
        .from('peer_specialists')
        .update({ is_verified: !specialist.is_verified })
        .eq('id', specialistId);

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
      const { data, error } = await supabase.rpc('soft_delete_specialist', {
        specialist_id: specialistId
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      
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
      const { error } = await supabase
        .from('peer_specialists')
        .update({ 
          is_active: true,
          is_verified: true
        })
        .eq('id', specialistId);

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

  const filteredSpecialists = specialists.filter(specialist =>
    `${specialist.first_name} ${specialist.last_name} ${specialist.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const activeSpecialists = filteredSpecialists.filter(s => s.is_active);
  const removedSpecialists = filteredSpecialists.filter(s => !s.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Specialist Management</h2>
          <p className="text-muted-foreground">Manage peer specialists and their access to the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search specialists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeSpecialists.length})</TabsTrigger>
          <TabsTrigger value="removed">Inactive ({removedSpecialists.length})</TabsTrigger>
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
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({
                          ...formData,
                          email: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={e => setFormData({
                          ...formData,
                          phone_number: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.first_name}
                        onChange={e => setFormData({
                          ...formData,
                          first_name: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.last_name}
                        onChange={e => setFormData({
                          ...formData,
                          last_name: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={e => setFormData({
                        ...formData,
                        bio: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.years_experience}
                      onChange={e => setFormData({
                        ...formData,
                        years_experience: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      type="url"
                      value={formData.avatar_url || ''}
                      onChange={e => setFormData({
                        ...formData,
                        avatar_url: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label>Specialties</Label>
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Add specialty"
                        value={newSpecialty}
                        onChange={e => setNewSpecialty(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      />
                      <Button type="button" onClick={addSpecialty} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        editingSpecialist ? 'Update Specialist' : 'Send Invitation'
                      )}
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