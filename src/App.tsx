import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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

function LayoutWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Printable page - standalone without providers */}
          <Route path="/journeys-guide" element={<PrintableJourneysGuide />} />
          
          {/* All other routes with shared AppLayout */}
          <Route element={<LayoutWrapper />}>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;