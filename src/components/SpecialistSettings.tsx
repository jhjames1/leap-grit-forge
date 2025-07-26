import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Clock, 
  Bell, 
  Shield,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Volume2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { audioNotification } from '@/utils/audioNotification';

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
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    specialties: [] as string[],
    status: 'offline' as 'online' | 'away' | 'offline',
    status_message: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    audioNotifications: false,
    audioNotificationVolume: 0.3
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
      
      // Load notification settings
      loadNotificationSettings();
    }
  }, [specialist]);

  const loadNotificationSettings = async () => {
    if (!specialist?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('specialist_calendar_settings')
        .select('notification_preferences')
        .eq('specialist_id', specialist.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setNotificationSettings({
          audioNotifications: prefs.audioNotifications || false,
          audioNotificationVolume: prefs.audioNotificationVolume || 0.3
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast({
        title: "Invalid Password",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    if (!passwordData.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password.",
        variant: "destructive"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setShowPasswordSection(false);

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully."
      });

      // Log the password change
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'password_changed',
          type: 'security',
          details: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'specialist_settings'
          })
        });

    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Password Update Failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

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

      // Update notification settings
      const { error: notificationError } = await supabase
        .from('specialist_calendar_settings')
        .upsert({
          specialist_id: specialist.id,
          notification_preferences: {
            app: true,
            email: true,
            sms: false,
            audioNotifications: notificationSettings.audioNotifications,
            audioNotificationVolume: notificationSettings.audioNotificationVolume
          }
        });

      if (notificationError) throw notificationError;

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

  const testAudioNotification = () => {
    try {
      audioNotification.playTwoToneNotification();
      toast({
        title: "Audio Test",
        description: "Test notification played successfully!"
      });
    } catch (error) {
      toast({
        title: "Audio Test Failed",
        description: "Could not play audio. Please check your browser settings.",
        variant: "destructive"
      });
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

          {/* Security Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock size={18} />
                Security Settings
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                Change Password
              </Button>
            </div>

            {showPasswordSection && (
              <Card className="p-4 space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {passwordData.newPassword && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    size="sm"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Audio Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Volume2 size={18} />
              Audio Notifications
            </h3>
            
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audio-notifications">Enable Audio Notifications</Label>
                  <p className="text-sm text-muted-foreground">Play sound when new chat sessions arrive</p>
                </div>
                <Switch
                  id="audio-notifications"
                  checked={notificationSettings.audioNotifications}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, audioNotifications: checked }))}
                />
              </div>
              
              {notificationSettings.audioNotifications && (
                <>
                  <div className="space-y-2">
                    <Label>Notification Volume</Label>
                    <div className="px-2">
                      <Slider
                        value={[notificationSettings.audioNotificationVolume]}
                        onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, audioNotificationVolume: value[0] }))}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Volume: {Math.round(notificationSettings.audioNotificationVolume * 100)}%
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testAudioNotification}
                  >
                    Test Audio Notification
                  </Button>
                </>
              )}
            </Card>
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
