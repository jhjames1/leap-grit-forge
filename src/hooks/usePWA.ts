import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  showInstallPrompt: () => Promise<void>;
  hideInstallPrompt: () => void;
}

export const usePWA = (): PWAState => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isInStandaloneMode || isIOSStandalone);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallEvent);
      setIsInstallable(true);
      
      console.log('LEAP PWA: Install prompt available');
      
      // Show toast notification about app installation
      toast({
        title: "Install LEAP App",
        description: "Add LEAP to your home screen for quick access and offline support.",
        duration: 10000,
      });
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('LEAP PWA: App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      toast({
        title: "LEAP Installed!",
        description: "LEAP has been added to your home screen and is ready for offline use.",
      });
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('LEAP PWA: Back online');
      
      // Trigger background sync if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          // Use type assertion for sync as it's experimental
          const syncManager = (registration as any).sync;
          if (syncManager) {
            return syncManager.register('leap-data-sync');
          }
        }).catch(console.error);
      }
      
      toast({
        title: "Back Online",
        description: "Your recovery data is now syncing.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('LEAP PWA: Gone offline');
      
      toast({
        title: "Offline Mode",
        description: "Don't worry! LEAP works offline. Your progress is saved locally.",
        duration: 8000,
      });
    };

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service worker registration and message handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('LEAP PWA: Service Worker registered:', registration);
          
          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_DATA') {
              console.log('LEAP PWA: Sync message received:', event.data.message);
            }
          });
        })
        .catch(error => {
          console.error('LEAP PWA: Service Worker registration failed:', error);
        });
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const showInstallPrompt = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.log('LEAP PWA: No install prompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('LEAP PWA: Install prompt result:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Installing LEAP...",
          description: "The app is being added to your device.",
        });
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('LEAP PWA: Install prompt error:', error);
    }
  };

  const hideInstallPrompt = (): void => {
    setIsInstallable(false);
    setDeferredPrompt(null);
    console.log('LEAP PWA: Install prompt hidden');
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    showInstallPrompt,
    hideInstallPrompt
  };
};