import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Mail, Lock } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface EditProfileProps {
  onBack: () => void;
}

const EditProfile = ({ onBack }: EditProfileProps) => {
  const { t } = useLanguage();
  const { userData, updateUserData } = useUserData();
  const { user: authUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all user data and populate form
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, phone_number')
          .eq('user_id', authUser.id)
          .maybeSingle();

        // Get user preferences 
        const { data: preferencesData } = await supabase
          .from('user_preferences')
          .select('phone_number')
          .eq('user_id', authUser.id)
          .maybeSingle();

        // Populate form with existing data
        setFormData({
          firstName: profileData?.first_name || userData?.firstName || '',
          phoneNumber: profileData?.phone_number || preferencesData?.phone_number || localStorage.getItem('phoneNumber') || '',
          email: authUser.email || '',
          password: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [authUser, userData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('editProfile.firstNameRequired');
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber) {
      const cleaned = formData.phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.phoneNumber = t('editProfile.phoneNumberInvalid');
      }
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setFormData(prev => ({ ...prev, phoneNumber: formatPhoneNumber(cleaned) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      if (!authUser) {
        setErrors({ general: 'User not authenticated' });
        return;
      }

      // Update profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          first_name: formData.firstName,
          phone_number: formData.phoneNumber 
        })
        .eq('user_id', authUser.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (formData.email !== authUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (formData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });
        if (passwordError) throw passwordError;
      }

      // Update user preferences
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: authUser.id,
          phone_number: formData.phoneNumber 
        }, { onConflict: 'user_id' });

      if (prefError) throw prefError;

      alert(t('editProfile.updateSuccess'));
      onBack();
    } catch (error: any) {
      logger.error('Failed to update profile', error);
      setErrors({ general: error.message || t('editProfile.updateError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground mr-3"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-5xl text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">{t('editProfile.title').split(' ')[0]}</span><span className="font-fjalla font-extrabold italic">{t('editProfile.title').split(' ')[1] || ''}</span>
          </h1>
        </div>

        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300 max-w-md mx-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading profile data...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label className="text-card-foreground font-fjalla flex items-center space-x-2">
                <User size={16} />
                <span>{t('editProfile.firstName')}</span>
              </Label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-card border border-border text-card-foreground placeholder:text-muted-foreground"
                placeholder={t('editProfile.firstNamePlaceholder')}
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-card-foreground font-fjalla flex items-center space-x-2">
                <Mail size={16} />
                <span>Email Address</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-card border border-border text-card-foreground placeholder:text-muted-foreground"
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="text-card-foreground font-fjalla flex items-center space-x-2">
                <Phone size={16} />
                <span>{t('editProfile.phoneNumber')}</span>
              </Label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                className="bg-card border border-border text-card-foreground placeholder:text-muted-foreground"
                placeholder={t('editProfile.phoneNumberPlaceholder')}
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-card-foreground font-fjalla flex items-center space-x-2">
                <Lock size={16} />
                <span>New Password (optional)</span>
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-card border border-border text-card-foreground placeholder:text-muted-foreground"
                placeholder="Leave blank to keep current password"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            {formData.password && (
              <div className="space-y-2">
                <Label className="text-card-foreground font-fjalla flex items-center space-x-2">
                  <Lock size={16} />
                  <span>Confirm New Password</span>
                </Label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-card border border-border text-card-foreground placeholder:text-muted-foreground"
                  placeholder="Confirm your new password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
              </div>
            )}

            {errors.general && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded p-2">
                {errors.general}
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-fjalla font-bold"
            >
              {isSubmitting ? t('editProfile.updating') : t('editProfile.updateProfile')}
            </Button>
          </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;