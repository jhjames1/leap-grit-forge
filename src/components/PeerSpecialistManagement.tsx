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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Peer Specialist Management</h1>
          <p className="text-muted-foreground">Manage and invite peer specialists</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite New Specialist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSpecialist ? 'Edit Specialist' : 'Invite New Specialist'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingSpecialist ? handleEditSpecialist : handleInviteSpecialist} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              {!editingSpecialist && (
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Specialties</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Add specialty"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  />
                  <Button type="button" onClick={addSpecialty} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSpecialty(specialty)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting}>
                  {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingSpecialist ? 'Update' : 'Invite'} Specialist
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search specialists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Specialists</p>
                <p className="text-2xl font-bold">{specialists.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Specialists</p>
                <p className="text-2xl font-bold">{activeSpecialists.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified Specialists</p>
                <p className="text-2xl font-bold">{specialists.filter(s => s.is_verified).length}</p>
              </div>
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Specialists List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeSpecialists.length})</TabsTrigger>
          <TabsTrigger value="removed">Removed ({removedSpecialists.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="grid gap-4">
            {activeSpecialists.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Specialists</h3>
                  <p className="text-muted-foreground">Invite your first specialist to get started.</p>
                </CardContent>
              </Card>
            ) : (
              activeSpecialists.map((specialist) => (
                <Card key={specialist.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {specialist.first_name} {specialist.last_name}
                          </h3>
                          <div className="flex gap-2">
                            {specialist.is_verified ? (
                              <Badge variant="default">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{specialist.email}</p>
                        
                        {specialist.bio && (
                          <p className="text-sm mb-3">{specialist.bio}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {specialist.specialties?.map((specialty, index) => (
                            <Badge key={index} variant="outline">{specialty}</Badge>
                          ))}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {specialist.years_experience} years experience
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(specialist)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerifySpecialist(specialist.id)}>
                            {specialist.is_verified ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Verify
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(specialist.id)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate Specialist</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to deactivate {specialist.first_name} {specialist.last_name}? 
                                  They will lose access to the system but their data will be preserved.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleSoftDeleteSpecialist(specialist.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="removed">
          <div className="grid gap-4">
            {removedSpecialists.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Removed Specialists</h3>
                  <p className="text-muted-foreground">No specialists have been removed.</p>
                </CardContent>
              </Card>
            ) : (
              removedSpecialists.map((specialist) => (
                <Card key={specialist.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {specialist.first_name} {specialist.last_name}
                          </h3>
                          <Badge variant="destructive">Removed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{specialist.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivateSpecialist(specialist.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialog.isOpen} onOpenChange={(open) => setCredentialsDialog({...credentialsDialog, isOpen: open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Specialist Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>New credentials have been generated for {credentialsDialog.specialistName}:</p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-background px-2 py-1 rounded">{credentialsDialog.email}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(credentialsDialog.email)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-background px-2 py-1 rounded">{credentialsDialog.password}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(credentialsDialog.password)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please save these credentials securely. The specialist will need to change their password on first login.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default PeerSpecialistManagement;