import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

interface AppHeaderProps {
  onLogout?: () => void;
  showAuth?: boolean;
}

export function AppHeader({ onLogout, showAuth = true }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo */}
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/119b2322-45f6-44de-b789-4c906de98f49.png" 
          alt="LEAP Logo" 
          className="h-12 w-auto"
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <LanguageToggle />
        
        {showAuth && onLogout && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}