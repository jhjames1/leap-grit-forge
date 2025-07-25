import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    { id: 'best-practices', title: 'Best Practices', icon: Star },
    { id: 'faq', title: 'FAQ', icon: HelpCircle }
  ];

  // Search content index
  const searchableContent = useMemo(() => [
    // Quick Actions
    { id: 'how-start-chat', title: 'How do I start a new chat session?', section: 'chat-sessions', type: 'quick-action' },
    { id: 'how-schedule-appointment', title: 'How do I schedule an appointment?', section: 'calendar', type: 'quick-action' },
    { id: 'how-set-availability', title: 'How do I set my availability?', section: 'calendar', type: 'quick-action' },
    { id: 'how-end-session', title: 'How do I end a chat session?', section: 'chat-sessions', type: 'quick-action' },
    { id: 'how-block-time', title: 'How do I block time in my calendar?', section: 'calendar', type: 'quick-action' },
    { id: 'how-view-metrics', title: 'How do I view my performance metrics?', section: 'performance', type: 'quick-action' },
    { id: 'how-reset-password', title: 'How do I reset my password?', section: 'authentication', type: 'quick-action' },
    { id: 'how-update-profile', title: 'How do I update my profile?', section: 'settings', type: 'quick-action' },
    
    // FAQ Items
    { id: 'connection-issues', title: 'What should I do if I have connection issues?', section: 'troubleshooting', type: 'faq' },
    { id: 'session-timeout', title: 'Why did my session timeout?', section: 'troubleshooting', type: 'faq' },
    { id: 'notification-not-working', title: 'My notifications are not working', section: 'troubleshooting', type: 'faq' },
    { id: 'calendar-sync', title: 'How does calendar synchronization work?', section: 'calendar', type: 'faq' },
    { id: 'training-requirements', title: 'What training is required?', section: 'training', type: 'faq' },
    { id: 'performance-targets', title: 'What are the performance targets?', section: 'performance', type: 'faq' },
    
    // Section content
    ...sections.map(section => ({ 
      id: section.id, 
      title: section.title, 
      section: section.id, 
      type: 'section' 
    }))
  ], [sections]);

  const filteredContent = useMemo(() => {
    if (!searchQuery) return searchableContent;
    return searchableContent.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, searchableContent]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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
            <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4 mr-2" />
              Search Manual
              <CommandShortcut>⌘K</CommandShortcut>
            </Button>
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

        {/* Search Dialog */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Search manual or ask 'How do I...'" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Quick Actions">
              {filteredContent.filter(item => item.type === 'quick-action').map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    setActiveSection(item.section);
                    setSearchOpen(false);
                  }}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Frequently Asked Questions">
              {filteredContent.filter(item => item.type === 'faq').map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    setActiveSection(item.section);
                    setSearchOpen(false);
                  }}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Manual Sections">
              {filteredContent.filter(item => item.type === 'section').map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    setActiveSection(item.section);
                    setSearchOpen(false);
                  }}
                >
                  {sections.find(s => s.id === item.section)?.icon && 
                    React.createElement(sections.find(s => s.id === item.section)!.icon, { className: "mr-2 h-4 w-4" })
                  }
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
                <CardDescription>
                  <Input
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2"
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-1 p-4">
                    {sections.filter(section => 
                      section.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((section) => {
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
              {activeSection === 'faq' && <FAQSection />}
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

// Calendar Section Component
const CalendarSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Calendar & Scheduling
      </CardTitle>
      <CardDescription>
        Managing your availability and appointments
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Setting Your Availability</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to Set Availability
            </h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>Navigate to Calendar in the sidebar</li>
              <li>Click "Set Availability" or "Working Hours"</li>
              <li>Select your available days and times</li>
              <li>Choose recurrence patterns (daily, weekly, etc.)</li>
              <li>Save your availability schedule</li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Default Working Hours</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Monday - Friday: 8:00 AM - 6:00 PM</li>
                <li>• Weekend availability: Optional</li>
                <li>• Break times: 12:00 PM - 1:00 PM</li>
                <li>• Holiday schedule: System managed</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Availability Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <Badge variant="outline" className="text-xs">Available</Badge> Ready for sessions</li>
                <li>• <Badge variant="outline" className="text-xs bg-yellow-50">Busy</Badge> In active session</li>
                <li>• <Badge variant="outline" className="text-xs bg-red-50">Away</Badge> Temporarily unavailable</li>
                <li>• <Badge variant="outline" className="text-xs bg-gray-50">Blocked</Badge> Time blocked</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Appointment Scheduling</h3>
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Schedule follow-up appointments during or after chat sessions to provide 
            ongoing support and maintain user engagement.
          </p>
          
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Scheduling During Chat
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Use the appointment button in the chat interface to schedule directly with the user
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                Manual Scheduling
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Access the calendar view to manually create appointments and block time
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Calendar Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium">View Options</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Daily view for detailed scheduling</li>
              <li>• Weekly view for planning ahead</li>
              <li>• Monthly view for overview</li>
              <li>• Agenda view for appointments only</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Calendar Actions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Block time for administrative tasks</li>
              <li>• Set recurring availability patterns</li>
              <li>• Handle appointment conflicts</li>
              <li>• Export calendar data</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Time Management Tip
        </h4>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Block 15-30 minutes between appointments for documentation and preparation. 
          This ensures quality care and prevents scheduling conflicts.
        </p>
      </div>
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
      <CardDescription>
        Continuous learning and skill enhancement
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Required Training Modules</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-sm">Peer Support Fundamentals</h4>
                <p className="text-xs text-muted-foreground">Core principles and ethics</p>
                <Badge variant="outline" className="mt-1">Completed</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-sm">Crisis Intervention</h4>
                <p className="text-xs text-muted-foreground">Emergency response protocols</p>
                <Badge variant="outline" className="mt-1">Completed</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <h4 className="font-medium text-sm">Communication Skills</h4>
                <p className="text-xs text-muted-foreground">Active listening and empathy</p>
                <Badge variant="outline" className="mt-1 bg-yellow-50">In Progress</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-sm">Technology Platform</h4>
                <p className="text-xs text-muted-foreground">Platform features and tools</p>
                <Badge variant="outline" className="mt-1 bg-blue-50">Available</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Training Progress Tracking</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Overall Progress</h4>
              <span className="text-sm font-medium">75% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-medium">Modules Completed</h4>
              <p className="text-2xl font-bold text-green-600">6</p>
              <p className="text-xs text-muted-foreground">out of 8 required</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-medium">Hours Logged</h4>
              <p className="text-2xl font-bold text-blue-600">24</p>
              <p className="text-xs text-muted-foreground">training hours</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <h4 className="font-medium">Certifications</h4>
              <p className="text-2xl font-bold text-yellow-600">3</p>
              <p className="text-xs text-muted-foreground">earned certificates</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Mock Chat Training</h3>
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Practice your skills with simulated conversations before working with real users.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Available Scenarios
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• First-time user seeking support</li>
              <li>• Crisis intervention situation</li>
              <li>• Appointment scheduling request</li>
              <li>• Follow-up conversation</li>
              <li>• Resource information request</li>
            </ul>
          </div>
          
          <Button className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Start Mock Chat Session
          </Button>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
          Continuing Education
        </h4>
        <p className="text-sm text-purple-800 dark:text-purple-200">
          Complete monthly training updates and annual recertification to maintain 
          your specialist status and stay current with best practices.
        </p>
      </div>
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
      <CardDescription>
        Track your impact and identify areas for improvement
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Key Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h4 className="font-medium">Sessions Completed</h4>
            <p className="text-2xl font-bold text-blue-600">127</p>
            <p className="text-xs text-muted-foreground">This month</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+12% from last month</span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="font-medium">Avg Response Time</h4>
            <p className="text-2xl font-bold text-yellow-600">32s</p>
            <p className="text-xs text-muted-foreground">Response time</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Improved by 8s</span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h4 className="font-medium">User Satisfaction</h4>
            <p className="text-2xl font-bold text-green-600">4.8</p>
            <p className="text-xs text-muted-foreground">out of 5.0</p>
            <div className="flex items-center justify-center mt-2">
              <span className="text-xs text-green-600">Excellent rating</span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h4 className="font-medium">Follow-up Rate</h4>
            <p className="text-2xl font-bold text-purple-600">78%</p>
            <p className="text-xs text-muted-foreground">Return users</p>
            <div className="flex items-center justify-center mt-2">
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Above target</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Performance Targets</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Response Time</h4>
              <p className="text-sm text-muted-foreground">Average time to first response</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-green-600">32s</p>
              <p className="text-xs text-muted-foreground">Target: &lt;60s</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Session Completion</h4>
              <p className="text-sm text-muted-foreground">Successfully completed sessions</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-green-600">94%</p>
              <p className="text-xs text-muted-foreground">Target: &gt;85%</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">User Satisfaction</h4>
              <p className="text-sm text-muted-foreground">Average user feedback rating</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-green-600">4.8/5</p>
              <p className="text-xs text-muted-foreground">Target: &gt;4.0</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Training Progress</h4>
              <p className="text-sm text-muted-foreground">Completed training modules</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-yellow-600">75%</p>
              <p className="text-xs text-muted-foreground">Target: 100%</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Performance Analytics</h3>
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Access detailed analytics to understand your performance trends and identify 
            opportunities for improvement.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Weekly Reports</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Session volume and completion rates</li>
                <li>• Response time analysis</li>
                <li>• User feedback summaries</li>
                <li>• Performance goal tracking</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Monthly Reviews</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Comprehensive performance overview</li>
                <li>• Peer comparison metrics</li>
                <li>• Professional development recommendations</li>
                <li>• Goal setting for next month</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Performance Improvement Tips
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Review analytics weekly to identify trends</li>
          <li>• Set specific, measurable improvement goals</li>
          <li>• Use training modules to address skill gaps</li>
          <li>• Seek feedback from supervisors and peers</li>
        </ul>
      </div>
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
      <CardDescription>
        Available communication methods and best practices
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Communication Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <h4 className="font-medium">Text Chat</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time messaging</li>
              <li>• Quick response templates</li>
              <li>• File and link sharing</li>
              <li>• Conversation history</li>
              <li>• Typing indicators</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Video className="w-6 h-6 text-green-500" />
              <h4 className="font-medium">Video Sessions</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Face-to-face appointments</li>
              <li>• Screen sharing capabilities</li>
              <li>• Recording for training</li>
              <li>• High-quality audio/video</li>
              <li>• Mobile compatibility</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-6 h-6 text-purple-500" />
              <h4 className="font-medium">Voice Calls</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Traditional phone support</li>
              <li>• Crisis intervention line</li>
              <li>• Conference calling</li>
              <li>• Call recording available</li>
              <li>• International support</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-6 h-6 text-yellow-500" />
              <h4 className="font-medium">Notifications</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Session alerts</li>
              <li>• Appointment reminders</li>
              <li>• System updates</li>
              <li>• Performance notifications</li>
              <li>• Emergency alerts</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Communication Best Practices</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Active Listening
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mt-2">
              <li>• Give full attention to the user</li>
              <li>• Ask clarifying questions</li>
              <li>• Reflect back what you hear</li>
              <li>• Avoid interrupting</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Empathetic Responses
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mt-2">
              <li>• Acknowledge emotions</li>
              <li>• Use supportive language</li>
              <li>• Share appropriate experiences</li>
              <li>• Validate their feelings</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-purple-800 dark:text-purple-200">
              Professional Boundaries
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 mt-2">
              <li>• Maintain appropriate relationships</li>
              <li>• Keep personal information private</li>
              <li>• Follow ethical guidelines</li>
              <li>• Know when to escalate</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Response Templates</h3>
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Use pre-written templates for common responses to ensure consistency 
            and save time during busy sessions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded p-3">
              <h4 className="font-medium text-sm mb-1">Welcome Message</h4>
              <p className="text-xs text-muted-foreground italic">
                "Hello! I'm here to support you today. How are you feeling and what brings you here?"
              </p>
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium text-sm mb-1">Appointment Offer</h4>
              <p className="text-xs text-muted-foreground italic">
                "Would you like to schedule a follow-up appointment to continue our conversation?"
              </p>
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium text-sm mb-1">Crisis Response</h4>
              <p className="text-xs text-muted-foreground italic">
                "I understand you're going through a difficult time. Let's talk about how you're feeling right now."
              </p>
            </div>
            
            <div className="border rounded p-3">
              <h4 className="font-medium text-sm mb-1">Session Closing</h4>
              <p className="text-xs text-muted-foreground italic">
                "Thank you for sharing with me today. Remember, I'm here whenever you need support."
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Communication Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Respond promptly to maintain engagement</li>
          <li>• Use clear, simple language</li>
          <li>• Check for understanding regularly</li>
          <li>• Be patient and supportive</li>
          <li>• Document important points for follow-up</li>
        </ul>
      </div>
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
      <CardDescription>
        Customize your account and portal preferences
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Profile Settings</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <p className="text-sm text-muted-foreground">How your name appears to users</p>
              </div>
              <div>
                <label className="text-sm font-medium">Professional Title</label>
                <p className="text-sm text-muted-foreground">Your role or certification</p>
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <p className="text-sm text-muted-foreground">Brief professional background</p>
              </div>
              <div>
                <label className="text-sm font-medium">Specializations</label>
                <p className="text-sm text-muted-foreground">Areas of expertise</p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Contact Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-muted-foreground">Session updates and reminders</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">SMS Alerts</label>
                  <p className="text-xs text-muted-foreground">Urgent notifications only</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-muted-foreground">Browser notifications</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Portal Preferences</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Interface Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Dark Mode</label>
                  <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Sound Notifications</label>
                  <p className="text-xs text-muted-foreground">Audio alerts for new sessions</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-refresh Sessions</label>
                  <p className="text-xs text-muted-foreground">Automatically update session list</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Session Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Default Session Length</label>
                <p className="text-xs text-muted-foreground mb-2">Standard appointment duration</p>
                <select className="text-sm border rounded px-2 py-1">
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Break Time Between Sessions</label>
                <p className="text-xs text-muted-foreground mb-2">Buffer time for documentation</p>
                <select className="text-sm border rounded px-2 py-1">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Security Settings</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Account Security</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Two-Factor Authentication</label>
                  <p className="text-xs text-muted-foreground">Extra security for your account</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Session Timeout</label>
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <span className="text-sm">30 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Login Notifications</label>
                  <p className="text-xs text-muted-foreground">Alert for new device logins</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Privacy Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Data Analytics</label>
                  <p className="text-xs text-muted-foreground">Allow performance data collection</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Training Data Usage</label>
                  <p className="text-xs text-muted-foreground">Use sessions for training improvements</p>
                </div>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button>Save Changes</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
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
      <CardDescription>
        Common issues and step-by-step solutions
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Connection Issues</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Cannot Connect to Chat Sessions
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Sessions not loading, chat messages not sending</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Check your internet connection speed (minimum 1 Mbps required)</li>
                  <li>Refresh the browser page (Ctrl+F5 or Cmd+R)</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Disable browser extensions temporarily</li>
                  <li>Try using a different browser (Chrome, Firefox, Safari)</li>
                  <li>Check if firewall is blocking WebSocket connections</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Session Timeout Issues
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Frequent disconnections, automatic logouts</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Check session timeout settings in your profile</li>
                  <li>Ensure stable internet connection</li>
                  <li>Keep the portal tab active and visible</li>
                  <li>Avoid prolonged periods of inactivity</li>
                  <li>Contact admin if timeouts are too short</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Authentication Problems</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Cannot Log In
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Invalid credentials, account locked messages</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Verify your email address is correct</li>
                  <li>Reset your password using the "Forgot Password" link</li>
                  <li>Check if your account needs verification</li>
                  <li>Wait 15 minutes if account is temporarily locked</li>
                  <li>Contact administrator for account status</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Two-Factor Authentication Not Working
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: SMS codes not received, authenticator app issues</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Check phone signal and SMS delivery</li>
                  <li>Verify authenticator app time is synchronized</li>
                  <li>Use backup codes if available</li>
                  <li>Reset 2FA settings in your profile</li>
                  <li>Contact support for 2FA recovery</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Calendar and Scheduling Issues</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Appointments Not Showing
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Missing appointments, calendar sync issues</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Refresh the calendar view</li>
                  <li>Check date range and filter settings</li>
                  <li>Verify time zone settings are correct</li>
                  <li>Clear browser cache and reload</li>
                  <li>Check if appointments are in different status</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Cannot Set Availability
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Availability changes not saving, scheduling conflicts</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Check for existing appointments in the time slot</li>
                  <li>Verify you have permission to edit availability</li>
                  <li>Clear any conflicting blocked time</li>
                  <li>Save changes before navigating away</li>
                  <li>Contact admin if restrictions apply</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Performance and Display Issues</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Problem: Slow Loading or Poor Performance
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Symptoms: Pages load slowly, interface feels sluggish</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Solutions:</h5>
                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Close unnecessary browser tabs and applications</li>
                  <li>Clear browser cache and temporary files</li>
                  <li>Check available RAM and storage space</li>
                  <li>Update browser to latest version</li>
                  <li>Test with browser extensions disabled</li>
                  <li>Try using an incognito/private window</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Getting Additional Help</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h4 className="font-medium">Technical Support</h4>
            <p className="text-sm text-muted-foreground mb-2">For system and login issues</p>
            <p className="text-sm font-medium">1-800-LEAP-TECH</p>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h4 className="font-medium">Live Chat Support</h4>
            <p className="text-sm text-muted-foreground mb-2">Available 24/7</p>
            <Button size="sm" variant="outline">Start Chat</Button>
          </div>
          
          <div className="border rounded-lg p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h4 className="font-medium">Clinical Supervisor</h4>
            <p className="text-sm text-muted-foreground mb-2">For practice-related questions</p>
            <p className="text-sm font-medium">Contact via portal</p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Emergency Situations
        </h4>
        <p className="text-sm text-red-800 dark:text-red-200">
          If you encounter a user in crisis or emergency situation, immediately escalate 
          to your supervisor or emergency services. Never handle crisis situations alone.
        </p>
      </div>
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
      <CardDescription>
        Professional standards and evidence-based practices
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Core Peer Support Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <h4 className="font-medium">Hope and Recovery</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Believe in each person's ability to recover</li>
              <li>• Share recovery experiences appropriately</li>
              <li>• Focus on strengths and possibilities</li>
              <li>• Maintain optimistic yet realistic outlook</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-500" />
              <h4 className="font-medium">Mutual Respect</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Honor each person's unique journey</li>
              <li>• Avoid judgment and assumptions</li>
              <li>• Respect cultural differences</li>
              <li>• Value diverse perspectives</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-green-500" />
              <h4 className="font-medium">Self-Determination</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Support individual choice and autonomy</li>
              <li>• Avoid giving direct advice</li>
              <li>• Encourage self-advocacy</li>
              <li>• Respect decision-making process</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-purple-500" />
              <h4 className="font-medium">Shared Responsibility</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Collaborate in the support process</li>
              <li>• Share responsibility for outcomes</li>
              <li>• Encourage mutual accountability</li>
              <li>• Foster partnership approach</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Communication Best Practices</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Effective Listening Techniques
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mt-2">
              <li>• Give complete attention to the speaker</li>
              <li>• Use verbal and non-verbal encouragers</li>
              <li>• Reflect feelings and content accurately</li>
              <li>• Ask open-ended questions for clarification</li>
              <li>• Avoid interrupting or rushing responses</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Empathetic Response Strategies
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 mt-2">
              <li>• Acknowledge and validate emotions</li>
              <li>• Share similar experiences when appropriate</li>
              <li>• Use "I" statements to share perspective</li>
              <li>• Avoid minimizing or comparing struggles</li>
              <li>• Express genuine care and concern</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-purple-800 dark:text-purple-200">
              Strength-Based Approach
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 mt-2">
              <li>• Identify and highlight personal strengths</li>
              <li>• Focus on what's working well</li>
              <li>• Encourage self-efficacy and confidence</li>
              <li>• Build on existing coping strategies</li>
              <li>• Celebrate small victories and progress</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Professional Boundaries</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✓ Appropriate Practices
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Maintain professional relationships</li>
                <li>• Share recovery experiences appropriately</li>
                <li>• Respect confidentiality always</li>
                <li>• Focus on the person's goals</li>
                <li>• Refer to appropriate resources</li>
                <li>• Document interactions properly</li>
              </ul>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                ✗ Boundary Violations
              </h4>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                <li>• Developing personal friendships</li>
                <li>• Sharing too much personal information</li>
                <li>• Giving money or gifts</li>
                <li>• Meeting outside of work context</li>
                <li>• Providing professional therapy</li>
                <li>• Breaking confidentiality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Crisis Response Guidelines</h3>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Immediate Crisis Response
            </h4>
            <ol className="list-decimal list-inside text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>Stay calm and assess the situation</li>
              <li>Ensure immediate safety for everyone</li>
              <li>Do not leave the person alone</li>
              <li>Contact supervisor or emergency services</li>
              <li>Follow established crisis protocols</li>
              <li>Document the incident thoroughly</li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Warning Signs to Watch For</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Suicidal thoughts or threats</li>
                <li>• Self-harm behaviors</li>
                <li>• Substance abuse crisis</li>
                <li>• Domestic violence situations</li>
                <li>• Severe mental health episodes</li>
                <li>• Legal or safety emergencies</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Escalation Resources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clinical supervisor (immediate)</li>
                <li>• Crisis hotline services</li>
                <li>• Emergency services (911)</li>
                <li>• Mental health mobile crisis team</li>
                <li>• Domestic violence hotline</li>
                <li>• Substance abuse crisis services</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Self-Care and Wellness</h3>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Maintaining your own wellness is essential for providing effective peer support. 
            Remember that you cannot pour from an empty cup.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Physical Wellness</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Regular exercise and movement</li>
                <li>• Adequate sleep (7-9 hours)</li>
                <li>• Nutritious eating habits</li>
                <li>• Medical check-ups</li>
                <li>• Stress management techniques</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Emotional Wellness</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Regular self-reflection</li>
                <li>• Personal therapy or counseling</li>
                <li>• Healthy relationship maintenance</li>
                <li>• Boundaries with work stress</li>
                <li>• Emotional processing time</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Professional Wellness</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Regular supervision meetings</li>
                <li>• Peer consultation and support</li>
                <li>• Continuing education</li>
                <li>• Workload management</li>
                <li>• Professional development</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          <Star className="w-4 h-4 inline mr-1" />
          Remember: Quality Over Quantity
        </h4>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Focus on providing meaningful, authentic support rather than trying to help everyone. 
          One genuine connection can make a profound difference in someone's recovery journey.
        </p>
      </div>
    </CardContent>
  </Card>
);

// FAQ Section Component
const FAQSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5" />
        Frequently Asked Questions
      </CardTitle>
      <CardDescription>
        Common questions and helpful answers
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
              Q: How do I start my first chat session?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Navigate to the Chat Sessions section in the sidebar. Look for sessions with "Waiting" status, 
              click on one to view details, then click "Start Chat" to claim the session and begin helping the user.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
              Q: What training do I need to complete?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: All specialists must complete Peer Support Fundamentals, Crisis Intervention, Communication Skills, 
              and Technology Platform training. Check the Training section for your progress and available modules.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
              Q: How do I set my availability for appointments?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Go to Calendar in the sidebar, click "Set Availability" or "Working Hours", select your available 
              days and times, choose recurrence patterns, and save your schedule.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Technical Issues</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Q: What should I do if I can't connect to chat sessions?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: First, check your internet connection and refresh the page. If issues persist, clear your browser 
              cache, disable extensions temporarily, or try a different browser. Check the Troubleshooting section for detailed steps.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Q: Why do my sessions keep timing out?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Session timeouts occur due to inactivity or connection issues. Ensure stable internet, keep the portal 
              tab active, and check your timeout settings in Settings. Avoid prolonged periods without activity.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
              Q: My notifications aren't working. How do I fix this?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Check your browser notification permissions, verify notification settings in your profile, 
              and ensure sound is enabled. Try refreshing the page or restarting your browser.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Performance & Metrics</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              Q: What are the performance targets I should aim for?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Key targets include: Response time under 60 seconds, session completion rate above 85%, 
              user satisfaction rating above 4.0, and 100% training completion. Check the Performance section for details.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              Q: How often are my performance metrics updated?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Metrics update in real-time as you work. Weekly reports are generated automatically, 
              and monthly comprehensive reviews are available in the Performance section.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
              Q: Where can I see my user feedback and ratings?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: User feedback and ratings are available in the Performance Analytics section. 
              You'll see your average rating, recent feedback, and trends over time.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Appointments & Scheduling</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
              Q: How does calendar synchronization work?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: The calendar automatically syncs with your availability settings and appointments. 
              Changes are reflected in real-time. You can export your calendar or integrate with external calendar apps.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
              Q: Can I schedule appointments during a chat session?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Yes! Use the appointment scheduling button in the chat interface to schedule follow-up 
              appointments directly with the user during your conversation.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">
              Q: How do I handle scheduling conflicts?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: The system prevents double-booking automatically. If conflicts arise, you can reschedule 
              appointments, block time for administrative tasks, or adjust your availability in the calendar settings.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Professional Support</h3>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
              Q: When should I contact my supervisor?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Contact your supervisor for crisis situations, ethical dilemmas, challenging cases, 
              professional development questions, or when you need clinical guidance or support.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
              Q: What should I do in a crisis situation?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Stay calm, ensure immediate safety, do not leave the person alone, contact your supervisor 
              or emergency services immediately, follow crisis protocols, and document thoroughly. See Best Practices for details.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
              Q: How do I maintain professional boundaries?
            </h4>
            <p className="text-sm text-muted-foreground">
              A: Maintain professional relationships, avoid personal friendships with users, don't share 
              too much personal information, respect confidentiality, and refer to the Best Practices section for detailed guidelines.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          <HelpCircle className="w-4 h-4 inline mr-1" />
          Still Have Questions?
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          If you can't find the answer you're looking for, don't hesitate to reach out for help:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center">
            <Phone className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-xs font-medium">Technical Support</p>
            <p className="text-xs">1-800-LEAP-TECH</p>
          </div>
          <div className="text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-xs font-medium">Live Chat</p>
            <p className="text-xs">Available 24/7</p>
          </div>
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-xs font-medium">Supervisor</p>
            <p className="text-xs">Clinical questions</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default PeerSpecialistManual;
