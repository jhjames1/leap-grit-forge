import React, { useState } from 'react';
import { 
  BookOpen, 
  Video, 
  Download, 
  Search, 
  ExternalLink, 
  Clock,
  User,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Shield,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DocumentationItem {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'pdf' | 'interactive';
  category: 'basics' | 'chat' | 'calendar' | 'crisis' | 'advanced';
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url?: string;
  downloadable?: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const documentationItems: DocumentationItem[] = [
  {
    id: 'portal-overview',
    title: 'Specialist Portal Overview',
    description: 'Complete guide to navigating the peer specialist portal',
    type: 'guide',
    category: 'basics',
    difficulty: 'beginner',
    duration: 10
  },
  {
    id: 'chat-basics-video',
    title: 'Chat Management Basics',
    description: 'Video tutorial covering fundamental chat operations',
    type: 'video',
    category: 'chat',
    difficulty: 'beginner',
    duration: 15,
    url: '/videos/chat-basics.mp4'
  },
  {
    id: 'crisis-response-guide',
    title: 'Crisis Response Protocol',
    description: 'Essential guide for handling emergency situations',
    type: 'pdf',
    category: 'crisis',
    difficulty: 'advanced',
    downloadable: true
  },
  {
    id: 'calendar-management',
    title: 'Calendar & Scheduling Guide',
    description: 'Master appointment scheduling and availability management',
    type: 'interactive',
    category: 'calendar',
    difficulty: 'intermediate',
    duration: 20
  },
  {
    id: 'difficult-conversations',
    title: 'Handling Difficult Conversations',
    description: 'Strategies for navigating challenging peer interactions',
    type: 'video',
    category: 'chat',
    difficulty: 'advanced',
    duration: 25,
    url: '/videos/difficult-conversations.mp4'
  },
  {
    id: 'security-protocols',
    title: 'Security & Privacy Protocols',
    description: 'Understanding confidentiality and security measures',
    type: 'guide',
    category: 'advanced',
    difficulty: 'intermediate',
    duration: 12
  }
];

const faqItems: FAQItem[] = [
  {
    id: 'login-issues',
    question: 'I\'m having trouble logging into the specialist portal',
    answer: 'If you\'re experiencing login issues, first ensure you\'re using the correct credentials provided during your invitation. If the problem persists, check your internet connection and try clearing your browser cache. Contact your administrator if issues continue.',
    category: 'Technical',
    tags: ['login', 'access', 'credentials']
  },
  {
    id: 'chat-notification',
    question: 'How do I know when someone wants to chat with me?',
    answer: 'You\'ll receive notifications through the portal when peers request to chat. Make sure your browser notifications are enabled and your status is set to "Available" to receive chat requests.',
    category: 'Communication',
    tags: ['notifications', 'chat', 'availability']
  },
  {
    id: 'emergency-protocol',
    question: 'What should I do if a peer mentions self-harm?',
    answer: 'Immediately follow the crisis response protocol: 1) Stay calm and engaged, 2) Don\'t leave the peer alone, 3) Use the emergency escalation feature in the portal, 4) Contact emergency services if there\'s imminent danger, 5) Document the interaction thoroughly.',
    category: 'Crisis Management',
    tags: ['crisis', 'emergency', 'self-harm', 'protocol']
  },
  {
    id: 'schedule-management',
    question: 'How do I set my availability hours?',
    answer: 'Go to your calendar settings and configure your working hours. You can set different availability for different days and create recurring schedules. Remember to update your availability when you have planned absences.',
    category: 'Scheduling',
    tags: ['calendar', 'availability', 'schedule']
  },
  {
    id: 'confidentiality',
    question: 'What information can I share with other specialists?',
    answer: 'Only share information that is necessary for peer support and follows your organization\'s confidentiality policies. Never share personal identifying information, and always consider whether sharing is in the peer\'s best interest.',
    category: 'Privacy',
    tags: ['confidentiality', 'privacy', 'sharing']
  }
];

export function TrainingDocumentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredDocs = documentationItems.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqItems.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <Download className="h-4 w-4" />;
      case 'interactive': return <PlayCircle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'crisis': return <AlertTriangle className="h-4 w-4" />;
      case 'advanced': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training Documentation</h1>
          <p className="text-muted-foreground">
            Comprehensive guides, tutorials, and resources for peer specialists
          </p>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select 
            className="px-3 py-2 border rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="basics">Basics</option>
            <option value="chat">Chat Management</option>
            <option value="calendar">Calendar</option>
            <option value="crisis">Crisis Response</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="guides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="guides">Guides & Tutorials</TabsTrigger>
          <TabsTrigger value="videos">Video Library</TabsTrigger>
          <TabsTrigger value="references">Quick References</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(doc.type)}
                      <Badge variant="outline" className={getDifficultyColor(doc.difficulty)}>
                        {doc.difficulty}
                      </Badge>
                    </div>
                    {getCategoryIcon(doc.category)}
                  </div>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {doc.duration && (
                        <>
                          <Clock className="h-4 w-4" />
                          {doc.duration} min
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {doc.downloadable && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm">
                        {doc.type === 'interactive' ? 'Start' : 'View'}
                        {doc.url && <ExternalLink className="h-4 w-4 ml-1" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.filter(doc => doc.type === 'video').map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    <CardTitle>{doc.title}</CardTitle>
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {doc.duration} minutes
                    </div>
                    <Button>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Play Video
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="references" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Accept a chat request
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Set availability status
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Schedule an appointment
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Document a session
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <strong>Crisis Hotline:</strong> 988
                </div>
                <div className="text-sm">
                  <strong>Emergency Services:</strong> 911
                </div>
                <div className="text-sm">
                  <strong>Admin Support:</strong> admin@example.com
                </div>
                <div className="text-sm">
                  <strong>Technical Support:</strong> support@example.com
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions and answers for peer specialists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p className="text-sm">{faq.answer}</p>
                        <div className="flex gap-1">
                          <Badge variant="outline">{faq.category}</Badge>
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}