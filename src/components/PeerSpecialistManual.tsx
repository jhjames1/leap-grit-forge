import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Monitor, 
  MessageSquare, 
  Calendar, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Phone,
  Video,
  FileText,
  Download,
  Search,
  Home,
  LogIn,
  Shield,
  Eye,
  Star,
  TrendingUp,
  Bell,
  HelpCircle
} from 'lucide-react';

const PeerSpecialistManual = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'authentication', title: 'Authentication', icon: LogIn },
    { id: 'dashboard', title: 'Dashboard', icon: Monitor },
    { id: 'chat-sessions', title: 'Chat Sessions', icon: MessageSquare },
    { id: 'calendar', title: 'Calendar', icon: Calendar },
    { id: 'training', title: 'Training', icon: GraduationCap },
    { id: 'performance', title: 'Performance', icon: BarChart3 },
    { id: 'communication', title: 'Communication', icon: Phone },
    { id: 'settings', title: 'Settings', icon: Settings },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertCircle },
    { id: 'best-practices', title: 'Best Practices', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Peer Specialist Training Manual
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete guide to using the LEAP Specialist Portal
          </p>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Print Version
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1 p-4">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <Button
                          key={section.id}
                          variant={activeSection === section.id ? "default" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => setActiveSection(section.id)}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {section.title}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <ScrollArea className="h-[800px]">
              {activeSection === 'overview' && <OverviewSection />}
              {activeSection === 'authentication' && <AuthenticationSection />}
              {activeSection === 'dashboard' && <DashboardSection />}
              {activeSection === 'chat-sessions' && <ChatSessionsSection />}
              {activeSection === 'calendar' && <CalendarSection />}
              {activeSection === 'training' && <TrainingSection />}
              {activeSection === 'performance' && <PerformanceSection />}
              {activeSection === 'communication' && <CommunicationSection />}
              {activeSection === 'settings' && <SettingsSection />}
              {activeSection === 'troubleshooting' && <TroubleshootingSection />}
              {activeSection === 'best-practices' && <BestPracticesSection />}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        System Overview
      </CardTitle>
      <CardDescription>
        Welcome to the LEAP Peer Specialist Portal
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">What is the Specialist Portal?</h3>
        <p className="text-muted-foreground mb-4">
          The LEAP Specialist Portal is a comprehensive platform designed to help peer specialists 
          provide effective support through chat sessions, appointment scheduling, and continuous training.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Real-time Chat</h4>
              <p className="text-sm text-muted-foreground">
                Instant messaging with users seeking support
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Appointment Scheduling</h4>
              <p className="text-sm text-muted-foreground">
                Schedule and manage ongoing appointments
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Training Modules</h4>
              <p className="text-sm text-muted-foreground">
                Continuous learning and skill development
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Performance Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Track your impact and improvement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Getting Started Checklist</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Complete account verification</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Set up your profile and availability</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Complete required training modules</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Familiarize yourself with the chat interface</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Review best practices and guidelines</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Quick Navigation Tip
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Use the sidebar menu to quickly jump between different sections of the portal. 
          The dashboard provides real-time updates on your sessions and performance.
        </p>
      </div>
    </CardContent>
  </Card>
);

// Authentication Section Component
const AuthenticationSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LogIn className="w-5 h-5" />
        Authentication & Access
      </CardTitle>
      <CardDescription>
        How to access and secure your specialist account
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Accessing the Portal</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Portal URL</h4>
            <code className="text-sm bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
              https://your-domain.com/specialist
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Login Process</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Navigate to the specialist portal URL</li>
              <li>Enter your email address and password</li>
              <li>Complete verification if required</li>
              <li>Wait for account verification check</li>
              <li>Access the dashboard upon successful login</li>
            </ol>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Account Verification</h3>
        <p className="text-muted-foreground mb-3">
          All specialist accounts must be verified before accessing the portal. This ensures 
          quality and security for all users.
        </p>
        <div className="space-y-2">
          <Badge variant="outline" className="mr-2">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
          <span className="text-sm text-muted-foreground">
            Your account is active and verified
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Password Management</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              First-Time Login
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              New specialists must change their temporary password on first login
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Password Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Minimum 8 characters long</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Include at least one number</li>
              <li>• Include at least one special character</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Security Notice
        </h4>
        <p className="text-sm text-red-800 dark:text-red-200">
          Never share your login credentials with anyone. Report any suspicious 
          activity to your administrator immediately.
        </p>
      </div>
    </CardContent>
  </Card>
);

// Dashboard Section Component
const DashboardSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Monitor className="w-5 h-5" />
        Dashboard Overview
      </CardTitle>
      <CardDescription>
        Understanding your main workspace
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Dashboard Layout</h3>
        <p className="text-muted-foreground mb-4">
          The dashboard is your central command center, providing real-time information 
          about your sessions, performance, and tasks.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Sidebar Navigation</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Chat Sessions</li>
              <li>• Calendar</li>
              <li>• Training</li>
              <li>• Analytics</li>
              <li>• Archive</li>
              <li>• Activity Log</li>
              <li>• Settings</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Main Content Area</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Performance metrics</li>
              <li>• Active sessions list</li>
              <li>• Chat interface</li>
              <li>• Calendar view</li>
              <li>• Training modules</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Metric Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h4 className="font-medium">Active Chats</h4>
            <p className="text-2xl font-bold text-blue-600">2</p>
            <p className="text-xs text-muted-foreground">Currently active sessions</p>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="font-medium">Waiting Chats</h4>
            <p className="text-2xl font-bold text-yellow-600">1</p>
            <p className="text-xs text-muted-foreground">Sessions waiting for you</p>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h4 className="font-medium">Completed Today</h4>
            <p className="text-2xl font-bold text-green-600">8</p>
            <p className="text-xs text-muted-foreground">Sessions completed today</p>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h4 className="font-medium">Avg Response</h4>
            <p className="text-2xl font-bold text-purple-600">45s</p>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Real-time Updates</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">New sessions appear automatically in your queue</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Metrics update in real-time as you work</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Notifications appear for important events</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          Pro Tip
        </h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Keep the dashboard open in a separate tab to monitor incoming sessions 
          while working on other tasks. The browser tab will show notifications 
          when new sessions arrive.
        </p>
      </div>
    </CardContent>
  </Card>
);

// Chat Sessions Section Component
const ChatSessionsSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Chat Sessions Management
      </CardTitle>
      <CardDescription>
        Managing conversations with users seeking support
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Session Status Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Waiting
            </Badge>
            <div>
              <p className="text-sm font-medium">User is waiting for a specialist</p>
              <p className="text-xs text-muted-foreground">You can claim these sessions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
            <div>
              <p className="text-sm font-medium">Ongoing conversation</p>
              <p className="text-xs text-muted-foreground">Session in progress</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Ended
            </Badge>
            <div>
              <p className="text-sm font-medium">Session completed</p>
              <p className="text-xs text-muted-foreground">Available in archive</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Timed Out
            </Badge>
            <div>
              <p className="text-sm font-medium">Session expired due to inactivity</p>
              <p className="text-xs text-muted-foreground">Automatically ended</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Claiming Sessions</h3>
        <div className="space-y-3">
          <p className="text-muted-foreground">
            When users start a chat, they enter a waiting queue. As a specialist, 
            you can claim these waiting sessions to begin helping the user.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to Claim a Session
            </h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>Look for sessions with "Waiting" status</li>
              <li>Click on the session to view details</li>
              <li>Click "Start Chat" to claim the session</li>
              <li>Begin conversation with the user</li>
            </ol>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Chat Interface Features</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Message Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border rounded p-3">
                <h5 className="font-medium text-sm">Text Messages</h5>
                <p className="text-xs text-muted-foreground">Regular conversation</p>
              </div>
              <div className="border rounded p-3">
                <h5 className="font-medium text-sm">Quick Actions</h5>
                <p className="text-xs text-muted-foreground">Pre-written responses</p>
              </div>
              <div className="border rounded p-3">
                <h5 className="font-medium text-sm">System Messages</h5>
                <p className="text-xs text-muted-foreground">Automated notifications</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Special Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Appointment scheduling within chat</li>
              <li>• Resource sharing capabilities</li>
              <li>• Connection status monitoring</li>
              <li>• Message read receipts</li>
              <li>• Typing indicators</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Session Management</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Starting a Session
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Claim waiting sessions promptly to reduce user wait times
            </p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              During a Session
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Maintain active engagement and respond thoughtfully to user needs
            </p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-purple-800 dark:text-purple-200">
              Ending a Session
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Properly close sessions and offer follow-up appointments when appropriate
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Additional section components would go here...
// For brevity, I'll create placeholder components for the remaining sections

const CalendarSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Calendar & Scheduling
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Detailed calendar and appointment scheduling documentation...
      </p>
    </CardContent>
  </Card>
);

const TrainingSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5" />
        Training & Development
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Training modules and professional development resources...
      </p>
    </CardContent>
  </Card>
);

const PerformanceSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Performance Analytics
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Performance tracking and improvement metrics...
      </p>
    </CardContent>
  </Card>
);

const CommunicationSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Phone className="w-5 h-5" />
        Communication Tools
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Available communication methods and best practices...
      </p>
    </CardContent>
  </Card>
);

const SettingsSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Settings & Preferences
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Account settings and personal preferences...
      </p>
    </CardContent>
  </Card>
);

const TroubleshootingSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Troubleshooting
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Common issues and solutions...
      </p>
    </CardContent>
  </Card>
);

const BestPracticesSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Star className="w-5 h-5" />
        Best Practices & Guidelines
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Professional standards and recommended practices...
      </p>
    </CardContent>
  </Card>
);

export default PeerSpecialistManual;