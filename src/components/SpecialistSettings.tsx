import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Clock, 
  Bell, 
  Shield,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SpecialistSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  specialist: any;
  onUpdateSpecialist: (specialist: any) => void;
}

const SpecialistSettings: React.FC<SpecialistSettingsProps> = ({
  isOpen,
  onClose,
  specialist,
  onUpdateSpecialist
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    specialties: [] as string[],
    status: 'offline' as 'online' | 'away' | 'offline',
    status_message: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (specialist) {
      setFormData({
        first_name: specialist.first_name || '',
        last_name: specialist.last_name || '',
        bio: specialist.bio || '',
        specialties: specialist.specialties || [],
        status: specialist.status?.status || 'offline',
        status_message: specialist.status?.status_message || ''
      });
    }
  }, [specialist]);

  const handleSave = async () => {
    if (!user || !specialist) return;

    setLoading(true);
    try {
      // Update specialist profile
      const { error: profileError } = await supabase
        .from('peer_specialists')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          specialties: formData.specialties,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialist.id);

      if (profileError) throw profileError;

      // Update specialist status
      const { error: statusError } = await supabase
        .from('specialist_status')
        .upsert({
          specialist_id: specialist.id,
          status: formData.status,
          status_message: formData.status_message,
          updated_at: new Date().toISOString()
        });

      if (statusError) throw statusError;

      // Update local state
      const updatedSpecialist = {
        ...specialist,
        ...formData,
        status: {
          status: formData.status,
          status_message: formData.status_message,
          last_active: new Date().toISOString()
        }
      };
      onUpdateSpecialist(updatedSpecialist);

      toast({
        title: "Settings Updated",
        description: "Your profile and status have been updated successfully."
      });

      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyAdd = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    }
  };

  const handleSpecialtyRemove = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-green-500' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500' }
  ];

  const commonSpecialties = [
    'Addiction Recovery',
    'Mental Health',
    'Trauma Support',
    'Peer Counseling',
    'Crisis Intervention',
    'Group Facilitation',
    'Relapse Prevention',
    'Life Skills',
    'Family Support',
    'Career Counseling'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Peer Support Specialist Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User size={18} />
              Profile Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell users about your experience and approach..."
                rows={4}
              />
            </div>
          </div>

          {/* Status Management */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} />
              Status & Availability
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Current Status</Label>
                <Select value={formData.status} onValueChange={(value: 'online' | 'away' | 'offline') => 
                  setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status_message">Status Message</Label>
                <Input
                  id="status_message"
                  value={formData.status_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_message: e.target.value }))}
                  placeholder="e.g., Available for chat"
                />
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} />
              Specialties
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {formData.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="cursor-pointer" onClick={() => handleSpecialtyRemove(specialty)}>
                  {specialty}
                  <X size={14} className="ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {commonSpecialties.filter(s => !formData.specialties.includes(s)).map((specialty) => (
                <Badge key={specialty} variant="outline" className="cursor-pointer" onClick={() => handleSpecialtyAdd(specialty)}>
                  {specialty}
                  +
                </Badge>
              ))}
            </div>
          </div>

          {/* Save Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistSettings;