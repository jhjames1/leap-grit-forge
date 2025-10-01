import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AppLayout } from "./components/AppLayout";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Printable page - standalone without providers */}
          <Route path="/journeys-guide" element={<PrintableJourneysGuide />} />
          
          {/* All other routes with full provider tree */}
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/admin" element={<AppLayout><AdminPortal /></AppLayout>} />
          <Route path="/admin-training" element={<AppLayout><AdminTrainingPortal /></AppLayout>} />
          <Route path="/user-experience-training" element={<AppLayout><UserExperienceTrainingPortal /></AppLayout>} />
          <Route 
            path="/specialist" 
            element={
              <AppLayout>
                <ErrorBoundary>
                  <PeerSpecialistPortal />
                </ErrorBoundary>
              </AppLayout>
            } 
          />
          <Route path="/specialist-manual" element={<AppLayout><SpecialistManual /></AppLayout>} />
          <Route path="/reset-password" element={<AppLayout><PasswordReset /></AppLayout>} />
          <Route path="/confirm" element={<AppLayout><EmailConfirmation /></AppLayout>} />
          <Route path="/test-confirm" element={<AppLayout><TestConfirmationScreen /></AppLayout>} />
          <Route path="/conoco" element={<AppLayout><ConocoPortal /></AppLayout>} />
          <Route path="/demo" element={<AppLayout><InteractiveDemo /></AppLayout>} />
          <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;