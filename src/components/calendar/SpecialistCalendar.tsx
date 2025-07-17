import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, Users, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpecialistCalendarProps {
  specialistId: string;
}

export default function SpecialistCalendar({ specialistId }: SpecialistCalendarProps) {
  console.log('🗓️ SpecialistCalendar - Component mounted with specialistId:', specialistId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('🗓️ SpecialistCalendar - useEffect running');
    setLoading(false);
  }, []);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Specialist Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>✅ Calendar component is now loading properly!</p>
            <p>Specialist ID: {specialistId}</p>
            <p>User ID: {user?.id}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Calendar Debug Info:</h3>
              <ul className="text-sm space-y-1">
                <li>• Component mounted successfully</li>
                <li>• React hooks working</li>
                <li>• Props received properly</li>
                <li>• Ready to implement full calendar</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button size="sm" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
              <Button size="sm" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Block Time
              </Button>
              <Button size="sm" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Set Location
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}