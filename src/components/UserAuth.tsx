
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

interface UserAuthProps {
  onLogin: (userData: { firstName: string; isNewUser: boolean }) => void;
}

const UserAuth = ({ onLogin }: UserAuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    firstName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.firstName.trim() || !credentials.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin) {
      if (credentials.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (credentials.password !== credentials.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    // For demo purposes, we'll store in localStorage
    // In production, this would connect to a secure backend
    const userKey = `user_${credentials.firstName.toLowerCase()}`;
    
    if (isLogin) {
      const storedUser = localStorage.getItem(userKey);
      if (!storedUser) {
        setError('User not found. Please create an account.');
        return;
      }
      const userData = JSON.parse(storedUser);
      if (userData.password !== credentials.password) {
        setError('Incorrect password.');
        return;
      }
      onLogin({ firstName: credentials.firstName, isNewUser: false });
    } else {
      const existingUser = localStorage.getItem(userKey);
      if (existingUser) {
        setError('User already exists. Please login instead.');
        return;
      }
      const userData = {
        firstName: credentials.firstName,
        password: credentials.password,
        createdAt: new Date().toISOString(),
        gratitudeEntries: [],
        activityLog: [],
        toolboxStats: { toolsToday: 0, streak: 1, totalSessions: 0 }
      };
      localStorage.setItem(userKey, JSON.stringify(userData));
      localStorage.setItem('currentUser', credentials.firstName);
      onLogin({ firstName: credentials.firstName, isNewUser: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-midnight border-steel-dark p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
            <User className="text-construction" size={32} />
          </div>
          <h2 className="font-oswald font-bold text-white text-2xl mb-2">
            {isLogin ? 'Welcome Back' : 'Welcome to LEAP'}
          </h2>
          <p className="text-steel-light text-sm">
            {isLogin ? 'Good to see you again.' : "Let's get you started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName" className="text-white font-oswald font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              value={credentials.firstName}
              onChange={(e) => setCredentials(prev => ({ ...prev, firstName: e.target.value }))}
              className="bg-steel-dark border-steel text-white placeholder:text-steel-light mt-1"
              placeholder="Enter your first name"
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
                placeholder={isLogin ? "Enter your password" : "Create a password (6+ characters)"}
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

          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword" className="text-white font-oswald font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="bg-steel-dark border-steel text-white placeholder:text-steel-light mt-1"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}

          <Button 
            type="submit"
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
          >
            {isLogin ? 'Log In' : 'Create My Account'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setCredentials({ firstName: '', password: '', confirmPassword: '' });
              }}
              className="text-steel-light hover:text-construction"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Button>
          </div>

          {isLogin && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setError('Contact support for password recovery.')}
                className="text-steel-light hover:text-construction text-sm"
              >
                Forgot password?
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default UserAuth;
