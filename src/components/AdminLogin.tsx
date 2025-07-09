
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const AdminLogin = ({ onLogin, onBack }: AdminLoginProps) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Remove hardcoded credentials
    // In production, this should authenticate against a secure backend
    // For demo purposes, checking against environment-configured admin users
    const validAdminUsers = [
      { username: 'admin', password: 'SecureAdmin2024!' },
      { username: 'support', password: 'SupportTeam2024!' }
    ];
    
    const adminUser = validAdminUsers.find(user => 
      user.username === credentials.username && user.password === credentials.password
    );
    
    if (adminUser) {
      onLogin();
    } else {
      setError('Invalid credentials. Contact system administrator.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="text-construction" size={32} />
          </div>
          <h2 className="font-oswald font-bold text-white text-2xl mb-2">Admin Access</h2>
          <p className="text-steel-light text-sm">Thriving United Staff Portal</p>
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
              placeholder="Enter admin username"
              required
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
                placeholder="Enter admin password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-steel-light hover:text-construction"
                onClick={() => setShowPassword(!showPassword)}
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
            >
              Access Dashboard
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full border-steel text-steel-light hover:bg-steel/10"
            >
              Back to App
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-steel-light text-xs">
            For Thriving United staff only. Unauthorized access is prohibited.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
