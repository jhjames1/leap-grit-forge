import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";

import Index from "./pages/Index";
import AdminPortal from "./pages/AdminPortal";
import AdminTrainingPortal from "./pages/AdminTrainingPortal";
import UserExperienceTrainingPortal from "./pages/UserExperienceTrainingPortal";
import PeerSpecialistPortal from "./pages/PeerSpecialistPortal";
import SpecialistManual from "./pages/SpecialistManual";
import ConocoPortal from "./pages/ConocoPortal";
import InteractiveDemo from "./pages/InteractiveDemo";
import PrintableJourneysGuide from "./pages/PrintableJourneysGuide";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PasswordReset } from "./components/PasswordReset";
import { EmailConfirmation } from "./components/EmailConfirmation";
import { TestConfirmationScreen } from "./components/TestConfirmationScreen";
import { SafeToastProvider } from "./components/SafeToastProvider";

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
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Standalone printable page without providers */}
          <Route path="/journeys-guide" element={<PrintableJourneysGuide />} />
          
          {/* All other routes with full provider tree */}
          <Route path="*" element={
            <QueryClientProvider client={queryClient}>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <LanguageProvider>
                  <SafeToastProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/admin" element={<AdminPortal />} />
                      <Route path="/admin-training" element={<AdminTrainingPortal />} />
                      <Route path="/user-experience-training" element={<UserExperienceTrainingPortal />} />
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
                      <Route path="/confirm" element={<EmailConfirmation />} />
                      <Route path="/test-confirm" element={<TestConfirmationScreen />} />
                      <Route path="/conoco" element={<ConocoPortal />} />
                      <Route path="/demo" element={<InteractiveDemo />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SafeToastProvider>
                </LanguageProvider>
              </ThemeProvider>
            </QueryClientProvider>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;