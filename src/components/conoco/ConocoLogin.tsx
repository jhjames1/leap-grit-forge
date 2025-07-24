import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
      // Simple username/password check
      if (credentials.username === 'admin' && credentials.password === 'adminadmin') {
        // Store auth state in localStorage
        localStorage.setItem('conoco-auth', 'true');
        onLogin();
      } else {
        throw new Error('Invalid credentials. Please check your username and password.');
      }
    } catch (error: any) {
      console.error('Conoco login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-black/25 border-steel-dark p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/lovable-uploads/00b955be-09d2-4d74-9aa0-10685a4b9b4d.png" 
              alt="ConocoPhillips" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className="font-oswald font-bold text-white text-2xl mb-2">Conoco Phillips</h2>
          <p className="text-steel-light text-sm">LEAP Dashboard Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-white font-oswald font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="bg-steel-dark border-steel text-white placeholder:text-steel-light mt-1"
              placeholder="Enter username"
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
                placeholder="Enter password"
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
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
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
            For authorized company administrators only.
          </p>
          <p className="text-steel-light text-xs mt-1">
            Demo credentials: admin / adminadmin
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ConocoLogin;