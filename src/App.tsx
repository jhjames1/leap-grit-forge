
import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { SafeToastProvider } from './components/SafeToastProvider';
import { AppUpdateNotification } from './components/AppUpdateNotification';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { AppHeader } from './components/AppHeader';
import Index from './pages/Index';
import AdminPortal from './pages/AdminPortal';
import PeerSpecialistPortal from './pages/PeerSpecialistPortal';
import ConocoPortal from './pages/ConocoPortal';
import SpecialistManual from './pages/SpecialistManual';
import InteractiveDemo from './pages/InteractiveDemo';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <SafeToastProvider>
            <Router>
              <div className="min-h-screen bg-midnight">
                <AppHeader />
                <div className="pt-16"> {/* Add padding for fixed header */}
                  <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/admin" element={<AdminPortal />} />
                      <Route path="/specialist" element={<PeerSpecialistPortal />} />
                      <Route path="/conoco" element={<ConocoPortal />} />
                      <Route path="/manual" element={<SpecialistManual />} />
                      <Route path="/demo" element={<InteractiveDemo />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </div>
                <AppUpdateNotification />
                <PWAInstallPrompt />
                <OfflineIndicator />
                <div className="fixed bottom-4 left-4 z-50">
                  <ThemeToggle />
                </div>
              </div>
            </Router>
          </SafeToastProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
