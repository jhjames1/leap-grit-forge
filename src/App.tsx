import React from 'react';
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <BrowserRouter>
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
              <Route path="/conoco" element={<ConocoPortal />} />
              <Route path="/employer" element={<EmployerPortal />} />
              <Route path="/demo" element={<InteractiveDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
