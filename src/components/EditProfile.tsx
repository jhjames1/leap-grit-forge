import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

interface EditProfileProps {
  onBack: () => void;
}

const EditProfile = ({ onBack }: EditProfileProps) => {
  const { t } = useLanguage();
  const { userData, updateUserData, currentUser } = useUserData();
  const [formData, setFormData] = useState({
    firstName: currentUser || '',
    phoneNumber: localStorage.getItem('phoneNumber') || ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('editProfile.firstNameRequired');
    }

    if (formData.phoneNumber) {
      const cleaned = formData.phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.phoneNumber = t('editProfile.phoneNumberInvalid');
      }
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
      // Update user data in localStorage (in production, this would be a backend API call)
      const userKey = `user_${formData.firstName.toLowerCase()}`;
      const existingData = localStorage.getItem(userKey);
      
      if (existingData) {
        const parsed = JSON.parse(existingData);
        const updatedData = {
          ...parsed,
          firstName: formData.firstName
        };
        
        localStorage.setItem(userKey, JSON.stringify(updatedData));
        localStorage.setItem('currentUser', formData.firstName);
        
        if (formData.phoneNumber) {
          localStorage.setItem('phoneNumber', formData.phoneNumber);
        }
        
        alert(t('editProfile.updateSuccess'));
        onBack();
      }
    } catch (error) {
      logger.error('Failed to update profile', error);
      setErrors({ general: t('editProfile.updateError') });
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
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;