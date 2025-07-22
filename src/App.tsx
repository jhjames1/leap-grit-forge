import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { SafeToastProvider } from "@/components/SafeToastProvider";
import Index from "./pages/Index";
import AdminPortal from "./pages/AdminPortal";
import PeerSpecialistPortal from "./pages/PeerSpecialistPortal";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
  // Debug: Verify React is available
  console.log('React object:', React);
  console.log('React.useState:', React?.useState);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <TooltipProvider>
              <SafeToastProvider>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </SafeToastProvider>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;