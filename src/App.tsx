
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppUpdateNotification } from "@/components/AppUpdateNotification";
import Index from "./pages/Index";
import AdminPortal from "./pages/AdminPortal";
import PeerSpecialistPortal from "./pages/PeerSpecialistPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={true}
        storageKey="leap-theme"
      >
        <Toaster />
        <Sonner />
        <AppUpdateNotification />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/specialist" element={<PeerSpecialistPortal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
