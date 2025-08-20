import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SpecialistLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const SpecialistLogin = ({ onLogin, onBack }: SpecialistLoginProps) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Authentication failed');
      }

      // Check if user is a verified peer specialist
      const { data: specialistData, error: specialistError } = await supabase
        .from('peer_specialists')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .eq('is_verified', true)
        .single();

      if (specialistError || !specialistData) {
        // Sign out the user if they're not a verified specialist
        await supabase.auth.signOut();
        throw new Error('Access denied. Verified peer specialist account required.');
      }

      onLogin();
    } catch (error: any) {
      console.error('Specialist login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
            <Users className="text-construction" size={32} />
          </div>
          <h2 className="font-oswald font-bold text-white text-2xl mb-2">Specialist Portal</h2>
          <p className="text-steel-light text-sm">Peer Support Specialist Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white font-oswald font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="bg-steel-dark border-steel text-white placeholder:text-steel-light mt-1"
              placeholder="Enter your specialist email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white font-oswald font-medium">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="bg-steel-dark border-steel text-white placeholder:text-steel-light pr-10"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-steel-light hover:text-construction"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button 
              type="submit"
              className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Portal'}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full border-steel text-steel-light hover:bg-steel/10"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-steel-light text-xs">
            For verified peer specialists only. Use your specialist account credentials.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SpecialistLogin;