import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, X, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PhoneCallRequest {
  id: string;
  request_token: string;
  specialist_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  metadata: any;
}

interface PhoneCallHandlerProps {
  sessionId: string;
}

const PhoneCallHandler: React.FC<PhoneCallHandlerProps> = ({ sessionId }) => {
  const [activeRequest, setActiveRequest] = useState<PhoneCallRequest | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isResponding, setIsResponding] = useState(false);
  const [specialistName, setSpecialistName] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Poll for active phone call requests
  useEffect(() => {
    if (!user || !sessionId) return;

    const checkForRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('phone_call_requests')
          .select(`
            *,
            peer_specialists (first_name, last_name)
          `)
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setActiveRequest(data);
          const specialist = data.peer_specialists as any;
          setSpecialistName(`${specialist?.first_name || ''} ${specialist?.last_name || ''}`.trim());
        } else {
          setActiveRequest(null);
        }
      } catch (err) {
        console.error('Error checking for phone requests:', err);
      }
    };

    checkForRequests();
    const interval = setInterval(checkForRequests, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, sessionId]);

  // Update countdown timer
  useEffect(() => {
    if (!activeRequest) return;

    const updateTimer = () => {
      const expiresAt = new Date(activeRequest.expires_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, expiresAt - now);
      
      setTimeLeft(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        setActiveRequest(null);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [activeRequest]);

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    if (!activeRequest || isResponding) return;

    setIsResponding(true);

    try {
      // Update request status to accepted
      const { error: updateError } = await supabase
        .from('phone_call_requests')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
          initiated_at: new Date().toISOString()
        })
        .eq('id', activeRequest.id);

      if (updateError) throw updateError;

      // Create the phone number that will redirect to specialist
      const systemPhoneNumber = 'tel:+1-800-LEAP-123'; // This would be your system number
      const phoneUrl = `${systemPhoneNumber}?token=${activeRequest.request_token}`;

      // Send system message about call initiation
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user!.id,
          sender_type: 'system',
          message_type: 'system',
          content: 'Phone call initiated - connecting you now...',
          metadata: {
            phone_request_id: activeRequest.id,
            call_status: 'connecting'
          }
        });

      // Initiate the phone call
      window.location.href = phoneUrl;

      toast({
        title: "Connecting Call",
        description: "You will be connected to your specialist momentarily.",
        duration: 5000,
      });

      setActiveRequest(null);
    } catch (err) {
      console.error('Error accepting phone call:', err);
      toast({
        title: "Connection Failed",
        description: "Could not initiate phone call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!activeRequest || isResponding) return;

    setIsResponding(true);

    try {
      // Update request status to declined
      const { error: updateError } = await supabase
        .from('phone_call_requests')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', activeRequest.id);

      if (updateError) throw updateError;

      // Send system message about call decline
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user!.id,
          sender_type: 'system',
          message_type: 'system',
          content: 'Phone call request declined - continuing with chat.',
          metadata: {
            phone_request_id: activeRequest.id,
            call_status: 'declined'
          }
        });

      toast({
        title: "Call Declined",
        description: "You can continue chatting normally.",
        duration: 3000,
      });

      setActiveRequest(null);
    } catch (err) {
      console.error('Error declining phone call:', err);
      toast({
        title: "Error",
        description: "Could not decline call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  if (!activeRequest) return null;

  return (
    <Card className="bg-gradient-to-r from-construction/20 to-construction-dark/20 border-construction border-2 p-4 mb-4 animate-pulse-slow">
      <div className="flex items-start gap-3">
        <div className="bg-construction p-2 rounded-full">
          <Phone className="text-midnight" size={20} />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-oswald font-bold text-white text-lg">
                Phone Call Request
              </h4>
              <div className="flex items-center gap-2 text-steel-light text-sm">
                <User size={14} />
                <span>From: {specialistName || 'Your Specialist'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-construction">
              <Clock size={16} />
              <span className="font-oswald font-semibold">
                {formatTimeLeft(timeLeft)}
              </span>
            </div>
          </div>

          <p className="text-steel-light text-sm">
            Your specialist would like to talk with you over the phone. 
            This can be helpful for more personal conversations or urgent matters.
          </p>

          <div className="bg-midnight/50 rounded-lg p-3">
            <p className="text-construction text-sm font-semibold mb-1">
              Privacy Protected
            </p>
            <p className="text-steel-light text-xs">
              Your call will be routed through our secure system. 
              Phone numbers are never shared between users.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 border-steel text-steel-light hover:text-white"
              disabled={isResponding}
            >
              <X size={16} className="mr-2" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
              disabled={isResponding}
            >
              <Phone size={16} className="mr-2" />
              {isResponding ? 'Connecting...' : 'Accept Call'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PhoneCallHandler;