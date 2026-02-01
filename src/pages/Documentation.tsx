import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Book, 
  Code, 
  Users, 
  Shield,
  ChevronRight,
  Printer,
  FileDown,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadDocumentation, downloadAsHtml } from '@/utils/completeDocumentationGenerator';
import { appInfo } from '@/data/codeDocumentation';

const Documentation = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'user-guide', label: 'User Guide', icon: Book },
    { id: 'specialist', label: 'Specialist Manual', icon: Users },
    { id: 'admin', label: 'Admin Guide', icon: Shield },
    { id: 'code', label: 'Code Reference', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">LEAP Documentation</h1>
                <p className="text-sm text-muted-foreground">Version {appInfo.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadAsHtml}
                className="hidden sm:flex"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
              <Button 
                onClick={downloadDocumentation}
                className="bg-construction hover:bg-construction/90 text-black"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <h2 className="font-semibold text-foreground mb-4">Contents</h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-construction/10 text-construction'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                      <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                        activeSection === section.id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">Quick Download</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get the complete documentation as a single file
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={downloadDocumentation}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {appInfo.name} Documentation
                    </h2>
                    <p className="text-muted-foreground">
                      {appInfo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-semibold text-foreground mb-2">Target Audience</h3>
                      <ul className="space-y-1">
                        {appInfo.targetAudience.map((audience, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-construction" />
                            {audience}
                          </li>
                        ))}
                      </ul>
                    </Card>
                    <Card className="p-4 bg-muted/30">
                      <h3 className="font-semibold text-foreground mb-2">Key Features</h3>
                      <ul className="space-y-1">
                        {appInfo.keyFeatures.slice(0, 5).map((feature, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-construction" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  <div className="bg-construction/10 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">📥 Download Complete Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get the full documentation including user guide, specialist manual, admin guide, 
                      and complete code reference in a single printable file.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={downloadDocumentation}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print / Save as PDF
                      </Button>
                      <Button variant="outline" onClick={downloadAsHtml}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download HTML
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">What's Included</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Book className="h-5 w-5 text-construction mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">User Guide</h4>
                          <p className="text-sm text-muted-foreground">
                            Complete guide for app users covering all features
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Users className="h-5 w-5 text-construction mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Specialist Manual</h4>
                          <p className="text-sm text-muted-foreground">
                            Training manual for peer support specialists
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Shield className="h-5 w-5 text-construction mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Admin Guide</h4>
                          <p className="text-sm text-muted-foreground">
                            Administration and management documentation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Code className="h-5 w-5 text-construction mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Code Reference</h4>
                          <p className="text-sm text-muted-foreground">
                            Technical documentation for developers
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'user-guide' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">User Guide</h2>
                  <p className="text-muted-foreground">
                    This section covers everything you need to know to use the LEAP Recovery app effectively.
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Topics Covered</h3>
                    <ul className="space-y-2">
                      {[
                        'Getting Started & Onboarding',
                        'Dashboard Overview',
                        'Recovery Journey (90-Day Program)',
                        'Toolbox Features (SteadySteel, Urge Tracker, Gratitude, etc.)',
                        'The Foreman AI Coach',
                        'Peer Chat Support',
                        'Profile & Settings',
                        'PWA Installation'
                      ].map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-construction" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      📄 Download the complete documentation to read the full User Guide with 
                      step-by-step instructions and screenshots.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'specialist' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Peer Specialist Manual</h2>
                  <p className="text-muted-foreground">
                    Training documentation for peer support specialists using the LEAP platform.
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Topics Covered</h3>
                    <ul className="space-y-2">
                      {[
                        'Portal Access & Authentication',
                        'Dashboard Navigation',
                        'Chat Session Management',
                        'Calendar & Scheduling',
                        'Communication Tools',
                        'Performance Metrics',
                        'Training Modules'
                      ].map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-construction" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'admin' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Admin Portal Guide</h2>
                  <p className="text-muted-foreground">
                    Documentation for platform administrators and managers.
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Topics Covered</h3>
                    <ul className="space-y-2">
                      {[
                        'User Management',
                        'Specialist Management',
                        'Analytics Dashboard',
                        'Content Management'
                      ].map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-construction" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'code' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Code Reference</h2>
                  <p className="text-muted-foreground">
                    Technical documentation for developers working with the LEAP codebase.
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Documentation Includes</h3>
                    <ul className="space-y-2">
                      {[
                        'Architecture Overview (Stack, Folder Structure, Data Flow)',
                        'Hooks Reference (30+ custom hooks)',
                        'Services Reference (API services)',
                        'Utilities Reference (Helper functions)',
                        'Edge Functions (20+ API endpoints)',
                        'Database Schema (Tables, RLS policies)',
                        'Component Architecture'
                      ].map((topic, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-construction" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      📄 The complete code documentation includes detailed tables with all hooks, 
                      services, utilities, and API endpoints. Download to view the full reference.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
