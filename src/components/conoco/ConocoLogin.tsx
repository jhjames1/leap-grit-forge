import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConocoLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const ConocoLogin = ({ onLogin, onBack }: ConocoLoginProps) => {
  const [credentials, setCredentials] = useState({
    username: '',
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
      // Call the edge function for authentication
      const { data, error: authError } = await supabase.functions.invoke('conoco-auth', {
        body: { 
          username: credentials.username, 
          password: credentials.password 
        }
      });

      if (authError) {
        throw new Error(authError.message || 'Authentication failed');
      }

      if (data?.success) {
        // Store auth state securely
        localStorage.setItem('conoco-auth', 'true');
        if (data.token) {
          localStorage.setItem('conoco-token', data.token);
        }
        if (data.expiresAt) {
          localStorage.setItem('conoco-expires', data.expiresAt);
        }
        onLogin();
      } else {
        throw new Error(data?.error || 'Invalid credentials. Please check your username and password.');
      }
    } catch (error: unknown) {
      console.error('Conoco login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img 
          src="/lovable-uploads/6f20bf7a-2728-4c31-b889-6754478892ba.png" 
          alt="ConocoPhillips" 
          className="h-16 w-auto mx-auto"
        />
      </div>
      
      <Card className="bg-card/50 border-border p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <h2 className="font-oswald font-bold text-foreground text-2xl mb-2">Conoco Phillips</h2>
          <p className="text-muted-foreground text-sm">LEAP Dashboard Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-foreground font-oswald font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground mt-1"
              placeholder="Enter username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground font-oswald font-medium">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10"
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 rounded p-2">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-oswald font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full border-border text-muted-foreground hover:bg-muted"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-xs">
            For authorized company administrators only.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Demo credentials: admin / adminadmin
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ConocoLogin;
