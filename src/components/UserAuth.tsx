
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { hashPassword, verifyPassword, validatePassword, sanitizeInput, checkRateLimit, recordAttempt, logSecurityEvent, setSecureSession, createSessionToken } from '@/utils/security';
import { SecureStorage } from '@/utils/secureStorage';

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
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPasswordErrors([]);
    
    try {
      // Sanitize inputs
      const sanitizedFirstName = sanitizeInput(credentials.firstName);
      const sanitizedPassword = credentials.password; // Don't sanitize password (may contain special chars)
      
      if (!sanitizedFirstName || !sanitizedPassword) {
        setError('Please fill in all fields');
        return;
      }

      // Check rate limiting
      const rateLimit = checkRateLimit(sanitizedFirstName);
      if (!rateLimit.allowed) {
        const timeLeft = Math.ceil((rateLimit.timeLeft || 0) / 1000 / 60);
        setError(`Too many attempts. Please try again in ${timeLeft} minutes.`);
        return;
      }

      if (isLogin) {
        // Login flow
        const existingUser = SecureStorage.getUserData(sanitizedFirstName);
        if (existingUser) {
          const passwordMatch = await verifyPassword(sanitizedPassword, existingUser.password);
          if (passwordMatch) {
            // Update last access
            SecureStorage.updateLastAccess(sanitizedFirstName);
            
            // Create secure session
            const sessionToken = createSessionToken();
            setSecureSession(sanitizedFirstName, sessionToken);
            
            localStorage.setItem('currentUser', sanitizedFirstName);
            logSecurityEvent('user_login', { username: sanitizedFirstName });
            onLogin({ firstName: sanitizedFirstName, isNewUser: false });
          } else {
            recordAttempt(sanitizedFirstName);
            logSecurityEvent('login_failed', { username: sanitizedFirstName, reason: 'invalid_password' });
            setError('Invalid password');
          }
        } else {
          recordAttempt(sanitizedFirstName);
          logSecurityEvent('login_failed', { username: sanitizedFirstName, reason: 'user_not_found' });
          setError('User not found');
        }
      } else {
        // Registration flow
        if (sanitizedPassword !== credentials.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        // Validate password strength
        const passwordValidation = validatePassword(sanitizedPassword);
        if (!passwordValidation.isValid) {
          setPasswordErrors(passwordValidation.errors);
          return;
        }
        
        const existingUser = SecureStorage.getUserData(sanitizedFirstName);
        if (existingUser) {
          setError('User already exists');
          return;
        }
        
        // Create new user with hashed password
        const hashedPassword = await hashPassword(sanitizedPassword);
        const newUser = {
          firstName: sanitizedFirstName,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          lastAccess: Date.now(),
          gratitudeEntries: [],
          activityLog: [],
          toolboxStats: {
            toolsToday: 0,
            streak: 0,
            totalSessions: 0,
            urgesThisWeek: 0
          }
        };
        
        SecureStorage.setUserData(sanitizedFirstName, newUser);
        
        // Create secure session
        const sessionToken = createSessionToken();
        setSecureSession(sanitizedFirstName, sessionToken);
        
        localStorage.setItem('currentUser', sanitizedFirstName);
        logSecurityEvent('user_registration', { username: sanitizedFirstName });
        onLogin({ firstName: sanitizedFirstName, isNewUser: true });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred. Please try again.');
      logSecurityEvent('auth_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
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
          
          {passwordErrors.length > 0 && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
              <p className="font-medium">Password requirements:</p>
              <ul className="list-disc list-inside mt-1 text-xs">
                {passwordErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            type="submit"
            className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : (isLogin ? 'Log In' : 'Create My Account')}
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
