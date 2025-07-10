import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const PWAInstallPrompt = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isInstallable, showInstallPrompt, hideInstallPrompt } = usePWA();

  if (!isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    await showInstallPrompt();
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    hideInstallPrompt();
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 p-4 bg-card border shadow-lg">
      <div className="flex items-start space-x-3">
        <div className="bg-primary p-2 rounded-lg flex-shrink-0">
          <Smartphone className="text-primary-foreground" size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground mb-1">
            Install LEAP App
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Add LEAP to your home screen for quick access and offline support.
          </p>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleInstall}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Download size={16} />
              <span>Install</span>
            </Button>
            
            <Button 
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              Later
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="flex-shrink-0 p-1 h-auto"
        >
          <X size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default PWAInstallPrompt;