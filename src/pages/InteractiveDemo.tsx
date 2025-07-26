import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Play, 
  Users, 
  TrendingUp, 
  Shield, 
  Calendar, 
  MessageCircle, 
  BarChart3,
  Clock,
  Award,
  ChevronRight,
  CheckCircle2,
  Star,
  ArrowRight,
  Camera,
  Download
} from 'lucide-react';

import { testingMode } from '@/utils/testingMode';
import DemoUserChat from '@/components/DemoUserChat';
import DemoTrainingSimulation from '@/components/DemoTrainingSimulation';
import SplashScreen from '@/components/SplashScreen';
import { DemoConocoPortal } from '@/components/DemoConocoPortal';

const InteractiveDemo = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentSection, setCurrentSection] = useState<'landing' | 'user-journey' | 'specialist-portal' | 'corporate-benefits' | 'white-label-demo'>('landing');
  const [userProgress, setUserProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDemoChat, setShowDemoChat] = useState(false);
  const [showTrainingSimulation, setShowTrainingSimulation] = useState(false);
  

  useEffect(() => {
    // Enable testing mode for demo
    testingMode.enableTestingMode();
    
    return () => {
      // Cleanup testing mode when leaving demo
      testingMode.disableTestingMode();
    };
  }, []);

  const demoStats = {
    activeUsers: 1247,
    sessionsToday: 89,
    avgResponseTime: '2.3 min',
    satisfactionRate: 94,
    completionRate: 87,
    monthlyEngagement: 92
  };

  const testimonials = [
    {
      name: "Sarah M., Operations Manager",
      company: "Manufacturing Corp",
      quote: "LEAP reduced our workplace incidents by 40% and increased employee satisfaction significantly.",
      rating: 5
    },
    {
      name: "David L., HR Director", 
      company: "Energy Solutions",
      quote: "The peer support model is incredibly effective. Our employees actually use and value this service.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Peer Support Network",
      description: "Connect employees with trained peer specialists for personalized support",
      benefits: ["24/7 availability", "Cultural competency", "Shared experience"]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Enterprise-grade security with complete anonymity protection",
      benefits: ["HIPAA compliant", "End-to-end encryption", "Zero data exposure"]
    },
    {
      icon: TrendingUp,
      title: "Measurable ROI",
      description: "Track engagement, outcomes, and cost savings with detailed analytics",
      benefits: ["Reduced absenteeism", "Lower turnover", "Improved productivity"]
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Integrated scheduling system for appointments and check-ins",
      benefits: ["Automated reminders", "Cross-timezone support", "Calendar integration"]
    }
  ];

  const renderLandingSection = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="font-oswald font-extralight">LEAP</span>
          <span className="font-fjalla font-extrabold italic text-primary"> DEMO</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          Experience how LEAP transforms workplace wellness through peer support
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => setCurrentSection('user-journey')}
            className="flex items-center gap-2"
          >
            <Play size={20} />
            Start Interactive Demo
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setCurrentSection('corporate-benefits')}
          >
            View Corporate Benefits
          </Button>
        </div>
      </div>

      {/* Platform Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-8">
          <p className="text-lg leading-relaxed text-foreground">
            The LEAP Platform is a comprehensive digital wellness solution designed specifically for workplace recovery and peer support. 
            It connects employees struggling with addiction, mental health challenges, or life transitions to trained peer specialists 
            through secure chat and scheduled appointments. The platform features AI-guided personalized recovery journeys, real-time 
            specialist analytics, corporate wellness dashboards, and robust training modules for peer specialists. With enterprise-grade 
            security, HIPAA compliance, and complete anonymity protection, LEAP empowers organizations to provide culturally competent, 
            measurable wellness support that reduces costs while improving employee outcomes and workplace safety.
          </p>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{demoStats.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{demoStats.satisfactionRate}%</div>
            <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{demoStats.avgResponseTime}</div>
            <div className="text-sm text-muted-foreground">Avg Response Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{demoStats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <feature.icon className="text-primary" size={24} />
                </div>
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-green-500" size={16} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );

  const renderUserJourney = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Experience Journey</h2>
        <Button variant="outline" onClick={() => setCurrentSection('landing')}>
          Back to Overview
        </Button>
      </div>

      {/* Journey Steps */}
      <div className="grid gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge className="bg-blue-500">1</Badge>
              Initial Assessment & Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              New users complete a brief, confidential assessment to match them with appropriate resources and peer specialists.
            </p>
            <div className="bg-white/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={16} />
                <span className="text-sm">Personal focus areas identified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={16} />
                <span className="text-sm">Matched with peer specialist</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={16} />
                <span className="text-sm">Recovery journey personalized</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge className="bg-green-500">2</Badge>
              Daily Engagement & Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Users access daily activities, tools, and support resources tailored to their recovery journey.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <Calendar className="text-green-500 mx-auto mb-2" size={24} />
                <div className="font-semibold text-sm">Daily Activities</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <MessageCircle className="text-green-500 mx-auto mb-2" size={24} />
                <div className="font-semibold text-sm">Peer Chat</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <Award className="text-green-500 mx-auto mb-2" size={24} />
                <div className="font-semibold text-sm">Progress Tracking</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge className="bg-purple-500">3</Badge>
              Peer Support & Professional Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              24/7 access to trained peer specialists who provide personalized support and crisis intervention when needed.
            </p>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Live Chat Session</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDemoChat(!showDemoChat)}
                >
                  {showDemoChat ? 'Hide Demo' : 'Try Interactive Chat'}
                </Button>
              </div>
              {!showDemoChat && (
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <strong>User:</strong> I'm having a really tough day and feeling overwhelmed...
                  </div>
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <strong>Peer Specialist:</strong> I hear you, and I want you to know that what you're feeling is completely valid. Let's work through this together...
                  </div>
                </div>
              )}
            </div>
            
            {showDemoChat && (
              <div className="mt-6">
                <DemoUserChat isVisible={showDemoChat} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="text-center">
        <Button 
          onClick={() => setCurrentSection('specialist-portal')}
          className="flex items-center gap-2"
        >
          Explore Specialist Portal
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );

  const renderSpecialistPortal = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Specialist Portal Overview</h2>
        <Button variant="outline" onClick={() => setCurrentSection('user-journey')}>
          Back to User Journey
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="text-primary" size={24} />
              Real-Time Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Active Sessions</span>
                <Badge>{demoStats.sessionsToday}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Response Time</span>
                <Badge variant="secondary">{demoStats.avgResponseTime}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Users Helped Today</span>
                <Badge className="bg-green-500">23</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="text-primary" size={24} />
              Smart Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Today's Appointments</span>
                  <Badge>4</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>10:00 AM - Check-in session</span>
                  <Badge variant="outline">Confirmed</Badge>
                </div>
                <div className="flex justify-between">
                  <span>2:00 PM - Crisis support</span>
                  <Badge className="bg-red-500">Urgent</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="text-primary" size={24} />
              Training Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Interactive training scenarios prepare specialists for various situations.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowTrainingSimulation(true)}
            >
              Launch Training Simulation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="text-primary" size={24} />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Sessions This Month</span>
                <span className="font-bold">127</span>
              </div>
              <div className="flex justify-between">
                <span>User Satisfaction</span>
                <span className="font-bold text-green-600">96%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Session Duration</span>
                <span className="font-bold">18 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="text-center">
        <Button 
          onClick={() => setCurrentSection('corporate-benefits')}
          className="flex items-center gap-2"
        >
          View Corporate Benefits
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );

  const renderCorporateBenefits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Corporate Benefits & ROI</h2>
        <Button variant="outline" onClick={() => setCurrentSection('landing')}>
          Back to Overview
        </Button>
      </div>

      {/* ROI Calculator */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle>ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2.8M</div>
              <div className="text-sm text-muted-foreground">Annual Savings</div>
              <div className="text-xs text-muted-foreground mt-1">Based on 1000 employees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">340%</div>
              <div className="text-sm text-muted-foreground">ROI</div>
              <div className="text-xs text-muted-foreground mt-1">First year implementation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">60%</div>
              <div className="text-sm text-muted-foreground">Reduction in Claims</div>
              <div className="text-xs text-muted-foreground mt-1">Wellness related</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Benefits */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Immediate Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={16} />
                <span>24/7 employee support coverage</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={16} />
                <span>Reduced crisis intervention costs</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={16} />
                <span>Improved workplace safety metrics</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={16} />
                <span>Enhanced employee retention</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Long-term Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={16} />
                <span>Sustainable culture change</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={16} />
                <span>Reduced absenteeism by 35%</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={16} />
                <span>Improved productivity metrics</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp className="text-blue-500" size={16} />
                <span>Lower insurance premiums</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge>Week 1-2</Badge>
              <span>Initial setup and specialist recruitment</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge>Week 3-4</Badge>
              <span>Training program and system integration</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge>Week 5-6</Badge>
              <span>Pilot program with select departments</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500">Week 7+</Badge>
              <span>Full organizational rollout</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-4">Ready to Transform Your Workplace?</h3>
          <p className="mb-6">Schedule a consultation to discuss implementation for your organization</p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg">
              Schedule Consultation
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Download ROI Report
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <button 
              onClick={() => setCurrentSection('landing')}
              className={`hover:text-foreground ${currentSection === 'landing' ? 'text-foreground font-semibold' : ''}`}
            >
              Overview
            </button>
            <ChevronRight size={16} />
            <button 
              onClick={() => setCurrentSection('user-journey')}
              className={`hover:text-foreground ${currentSection === 'user-journey' ? 'text-foreground font-semibold' : ''}`}
            >
              User Experience
            </button>
            <ChevronRight size={16} />
            <button 
              onClick={() => setCurrentSection('specialist-portal')}
              className={`hover:text-foreground ${currentSection === 'specialist-portal' ? 'text-foreground font-semibold' : ''}`}
            >
              Specialist Portal
            </button>
            <ChevronRight size={16} />
            <button 
              onClick={() => setCurrentSection('corporate-benefits')}
              className={`hover:text-foreground ${currentSection === 'corporate-benefits' ? 'text-foreground font-semibold' : ''}`}
            >
              Corporate Benefits
            </button>
            <ChevronRight size={16} />
            <button 
              onClick={() => setCurrentSection('white-label-demo')}
              className={`hover:text-foreground ${currentSection === 'white-label-demo' ? 'text-foreground font-semibold' : ''}`}
            >
              White Label Demo
            </button>
          </nav>
        </div>

        {/* Content */}
        {currentSection === 'landing' && renderLandingSection()}
        {currentSection === 'user-journey' && renderUserJourney()}
        {currentSection === 'specialist-portal' && renderSpecialistPortal()}
        {currentSection === 'corporate-benefits' && renderCorporateBenefits()}
        {currentSection === 'white-label-demo' && (
          <DemoConocoPortal onBack={() => setCurrentSection('landing')} />
        )}

        {/* Training Simulation Modal */}
        <DemoTrainingSimulation 
          isVisible={showTrainingSimulation}
          onClose={() => setShowTrainingSimulation(false)}
        />
      </div>
    </div>
  );
};

export default InteractiveDemo;