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
import EmployerPortal from "./pages/EmployerPortal";
import InteractiveDemo from "./pages/InteractiveDemo";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PasswordReset } from "./components/PasswordReset";
import { EmailConfirmation } from "./components/EmailConfirmation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminPortal />} />
                <Route path="/admin-training" element={<AdminTrainingPortal />} />
                <Route path="/user-experience-training" element={<UserExperienceTrainingPortal />} />
                <Route path="/specialist" element={<PeerSpecialistPortal />} />
                <Route path="/specialist-manual" element={<SpecialistManual />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/confirm" element={<EmailConfirmation />} />
                <Route path="/conoco" element={<ConocoPortal />} />
                <Route path="/employer" element={<EmployerPortal />} />
                <Route path="/demo" element={<InteractiveDemo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
