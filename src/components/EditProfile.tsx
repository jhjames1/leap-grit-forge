
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';

interface EditProfileProps {
  onBack: () => void;
}

const EditProfile = ({ onBack }: EditProfileProps) => {
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
      newErrors.firstName = 'First name is required';
    }

    if (formData.phoneNumber) {
      const cleaned = formData.phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
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
        
        // Show success message (you could add a toast here)
        alert('Profile updated successfully!');
        onBack();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-steel-light hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
          <span className="font-oswald font-extralight tracking-tight">EDIT</span><span className="font-fjalla font-extrabold italic">PROFILE</span>
        </h1>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label className="text-white font-oswald flex items-center space-x-2">
              <User size={16} />
              <span>First Name</span>
            </Label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="bg-steel-dark/50 border-steel text-white placeholder:text-steel-light"
              placeholder="Enter your first name"
            />
            {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName}</p>}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="text-white font-oswald flex items-center space-x-2">
              <Phone size={16} />
              <span>Phone Number</span>
            </Label>
            <Input
              type="tel"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className="bg-steel-dark/50 border-steel text-white placeholder:text-steel-light"
              placeholder="(555) 123-4567"
            />
            {errors.phoneNumber && <p className="text-red-400 text-sm">{errors.phoneNumber}</p>}
          </div>

          {errors.general && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded p-2">
              {errors.general}
            </div>
          )}

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default EditProfile;
