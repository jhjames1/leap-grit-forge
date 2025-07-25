import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { useSpecialistStatusScheduler } from "@/hooks/useSpecialistStatusScheduler";

import Index from "./pages/Index";
import AdminPortal from "./pages/AdminPortal";
import PeerSpecialistPortal from "./pages/PeerSpecialistPortal";
import SpecialistManual from "./pages/SpecialistManual";
import ConocoPortal from "./pages/ConocoPortal";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PasswordReset } from "./components/PasswordReset";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  // Initialize specialist status scheduler for automatic calendar-based status updates
  useSpecialistStatusScheduler();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminPortal />} />
                <Route 
                  path="/specialist" 
                  element={
                    <ErrorBoundary>
                      <PeerSpecialistPortal />
                    </ErrorBoundary>
                  } 
                />
                <Route path="/specialist-manual" element={<SpecialistManual />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/conoco" element={<ConocoPortal />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;