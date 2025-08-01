
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { sanitizeInput, logSecurityEvent } from '@/utils/security';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { logger } from '@/utils/logger';

interface UserAuthProps {
  onLogin: (userData: { firstName: string; isNewUser: boolean }) => void;
}

const UserAuth = ({ onLogin }: UserAuthProps) => {
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState({
    firstName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Sanitize inputs
      const sanitizedFirstName = sanitizeInput(credentials.firstName);
      
      if (!sanitizedFirstName) {
        setError(t('auth.firstName.required'));
        return;
      }

      // Check if user exists in localStorage
      const existingUser = localStorage.getItem(`user_${sanitizedFirstName.toLowerCase()}`);
      const isNewUser = !existingUser;

      if (isNewUser) {
        // Create new user
        const newUser = {
          firstName: sanitizedFirstName,
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
        
        localStorage.setItem(`user_${sanitizedFirstName.toLowerCase()}`, JSON.stringify(newUser));
        logSecurityEvent('user_registration', { username: sanitizedFirstName });
      } else {
        // Update last access for existing user
        const userData = JSON.parse(existingUser);
        userData.lastAccess = Date.now();
        localStorage.setItem(`user_${sanitizedFirstName.toLowerCase()}`, JSON.stringify(userData));
        logSecurityEvent('user_login', { username: sanitizedFirstName });
      }
      
      localStorage.setItem('currentUser', sanitizedFirstName);
      onLogin({ firstName: sanitizedFirstName, isNewUser });
    } catch (error) {
      logger.error('Authentication failed', error);
      setError(t('auth.error.general'));
      logSecurityEvent('auth_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="bg-card border-0 shadow-none p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-primary p-2 rounded-lg flex items-center justify-center mb-4">
            <User className="text-primary-foreground" size={32} />
          </div>
          <h2 className="font-fjalla font-bold text-card-foreground text-2xl mb-2">
            {t('auth.welcome.title')}
          </h2>
          <p className="text-muted-foreground text-sm font-source">
            {t('auth.welcome.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName" className="text-card-foreground font-fjalla font-medium">
              {t('auth.firstName.label')}
            </Label>
            <Input
              id="firstName"
              type="text"
              value={credentials.firstName}
              onChange={(e) => setCredentials(prev => ({ ...prev, firstName: e.target.value }))}
              className="bg-background border-border text-card-foreground placeholder:text-muted-foreground mt-1"
              placeholder={t('auth.firstName.placeholder')}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}

          <Button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-fjalla font-semibold"
            disabled={isLoading}
          >
            {isLoading ? t('auth.button.processing') : t('auth.button.enter')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default UserAuth;
