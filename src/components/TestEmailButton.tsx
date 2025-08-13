import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('leappeer@gmail.com'); // Default to last known user
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleResendConfirmation = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Get current user to use as admin
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('resend-confirmation', {
        body: { 
          email,
          adminUserId: user?.id 
        }
      });

      if (error) {
        throw error;
      }

      setResult({ success: true, message: data.message });
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      setResult({ 
        success: false, 
        message: error.message || 'Failed to resend confirmation email' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email Confirmation
        </CardTitle>
        <CardDescription>
          Trigger a test email confirmation to verify the email system is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Email Address</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="Enter email to test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={handleResendConfirmation} 
          disabled={loading || !email}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Resend Confirmation Email
        </Button>

        {result && (
          <Alert className={`border-${result.success ? 'green-500' : 'destructive'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription className={result.success ? 'text-green-700' : 'text-destructive'}>
                {result.message}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}