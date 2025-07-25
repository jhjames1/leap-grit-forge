import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, X, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PhoneCallRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  userId: string;
  specialistId: string;
  userFirstName?: string;
  userLastName?: string;
}

const PhoneCallRequestModal: React.FC<PhoneCallRequestModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  userId,
  specialistId,
  userFirstName,
  userLastName
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const validatePhoneNumbers = async () => {
    // Check if specialist has phone number
    const { data: specialist, error: specialistError } = await supabase
      .from('peer_specialists')
      .select('phone_number')
      .eq('id', specialistId)
      .single();

    if (specialistError || !specialist?.phone_number) {
      throw new Error('Specialist phone number not configured');
    }

    // Check if user has phone number in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.phone_number) {
      throw new Error('User phone number not available');
    }

    return { specialistPhone: specialist.phone_number, userPhone: profile.phone_number };
  };

  const handleSendRequest = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Validate both parties have phone numbers
      await validatePhoneNumbers();

      // Create phone call request
      const { data, error } = await supabase
        .from('phone_call_requests')
        .insert({
          session_id: sessionId,
          specialist_id: specialistId,
          user_id: userId,
          status: 'pending',
          metadata: {
            requested_by: 'specialist',
            user_name: `${userFirstName || ''} ${userLastName || ''}`.trim()
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Send a chat message about the phone call request
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          sender_type: 'specialist',
          message_type: 'phone_call_request',
          content: 'Phone call request sent - waiting for user response',
          metadata: {
            phone_request_id: data.id,
            request_token: data.request_token,
            expires_at: data.expires_at
          }
        });

      toast({
        title: "Phone Call Request Sent",
        description: "The user will receive a phone call prompt in their chat.",
        duration: 5000,
      });

      onClose();
    } catch (err) {
      console.error('Error sending phone call request:', err);
      toast({
        title: "Request Failed",
        description: err instanceof Error ? err.message : "Could not send phone call request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-steel-dark/90 backdrop-blur-sm border-steel border-2 p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-oswald font-bold text-white text-xl flex items-center gap-2">
            <Phone className="text-construction" size={24} />
            Phone Call Request
          </h3>
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
          <div className="bg-midnight/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-construction">
              <Shield size={18} />
              <span className="font-oswald font-semibold">Privacy Protected</span>
            </div>
            <p className="text-steel-light text-sm">
              Your phone number will never be revealed to the user. The call will be routed 
              through our secure system to protect your privacy.
            </p>
          </div>

          <div className="bg-midnight/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-construction">
              <Clock size={18} />
              <span className="font-oswald font-semibold">Request Details</span>
            </div>
            <div className="text-steel-light text-sm space-y-1">
              <p><strong>User:</strong> {userFirstName} {userLastName}</p>
              <p><strong>Expires:</strong> 10 minutes after sending</p>
              <p><strong>Type:</strong> Voice conversation</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-200 text-sm">
              The user will see a phone call prompt in their chat. If they accept, 
              they'll be connected to you via our secure phone system.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-steel text-steel-light hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              className="flex-1 bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PhoneCallRequestModal;