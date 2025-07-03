
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Phone, X } from 'lucide-react';

interface PhoneNumberPromptProps {
  onClose: () => void;
  onSave: () => void;
}

const PhoneNumberPrompt = ({ onClose, onSave }: PhoneNumberPromptProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
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
      setPhoneNumber(formatPhoneNumber(cleaned));
      setError('');
    }
  };

  const handleSave = () => {
    if (validatePhoneNumber(phoneNumber)) {
      localStorage.setItem('phoneNumber', phoneNumber);
      onSave();
    } else {
      setError('Please enter a valid 10-digit phone number');
    }
  };

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-oswald font-semibold text-white text-xl">Stay Connected</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-steel-light hover:text-white"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Phone className="text-midnight" size={20} />
            </div>
            <p className="text-steel-light">
              We use your number to help keep you connected and support your recovery.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-white font-oswald text-sm">Mobile Phone Number</label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="bg-steel-dark/50 border-steel text-white placeholder:text-steel-light"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          
          <Button
            onClick={handleSave}
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
          >
            Save Number and Continue
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PhoneNumberPrompt;
