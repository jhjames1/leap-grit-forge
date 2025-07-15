import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAIJourney } from '@/hooks/useAIJourney';
import { 
  FileText, 
  Download, 
  Heart, 
  Shield, 
  Target, 
  Users, 
  Calendar,
  Star,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface RecoveryPlanViewerProps {
  onClose?: () => void;
}

const RecoveryPlanViewer = ({ onClose }: RecoveryPlanViewerProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { recoveryPlan, week1Data, isWeek1Complete, refreshRecoveryPlan } = useAIJourney();

  const generatePlan = async () => {
    if (!isWeek1Complete) {
      toast({
        title: "Week 1 Not Complete",
        description: "Please complete Week 1 foundation activities first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-recovery-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate recovery plan');
      }

      const data = await response.json();
      
      if (data.success) {
        await refreshRecoveryPlan();
        toast({
          title: "Recovery Plan Generated!",
          description: "Your personalized recovery plan has been created.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate plan');
      }
    } catch (error) {
      console.error('Error generating recovery plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate your recovery plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPlan = () => {
    if (!recoveryPlan) return;

    const planData = recoveryPlan.plan_content as any;
    const planText = `
${planData.title}
Generated: ${new Date(recoveryPlan.generated_at).toLocaleDateString()}

${planData.sections.map((section: any) => `
${section.title.toUpperCase()}
${section.content}

Key Points:
${section.keyPoints.map((point: string) => `• ${point}`).join('\n')}
`).join('\n')}

QUICK REFERENCE
Emergency Contacts: ${planData.quickReference?.emergencyContacts?.join(', ') || 'None listed'}
Identity Reminders: ${planData.quickReference?.identityReminders?.join(', ') || 'None listed'}
Core Motivation: ${planData.quickReference?.coreMotivation || 'Not specified'}
    `;

    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Plan Downloaded",
      description: "Your recovery plan has been saved to your device.",
    });
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'mission':
        return <Target className="text-blue-500" size={20} />;
      case 'triggers':
        return <AlertTriangle className="text-orange-500" size={20} />;
      case 'support':
        return <Users className="text-green-500" size={20} />;
      case 'daily':
        return <Calendar className="text-purple-500" size={20} />;
      case 'crisis':
        return <Shield className="text-red-500" size={20} />;
      case 'progress':
        return <CheckCircle className="text-emerald-500" size={20} />;
      case 'vision':
        return <Star className="text-yellow-500" size={20} />;
      default:
        return <FileText className="text-gray-500" size={20} />;
    }
  };

  if (!recoveryPlan && !isWeek1Complete) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] p-4">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="mb-6">
            <Clock className="mx-auto text-muted-foreground mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">Recovery Plan Coming Soon</h2>
            <p className="text-muted-foreground">
              Complete Week 1 foundation activities to generate your personalized recovery plan.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Week 1 Foundation Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Day 2: Triggers identified</span>
                <Badge variant={week1Data?.triggers ? "default" : "secondary"}>
                  {week1Data?.triggers ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Day 3: Support triangle</span>
                <Badge variant={week1Data?.support_triangle ? "default" : "secondary"}>
                  {week1Data?.support_triangle ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Day 4: Core why</span>
                <Badge variant={week1Data?.core_why ? "default" : "secondary"}>
                  {week1Data?.core_why ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Day 5: Identity words</span>
                <Badge variant={week1Data?.identity_words ? "default" : "secondary"}>
                  {week1Data?.identity_words ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Day 6: Safe space</span>
                <Badge variant={week1Data?.safe_space ? "default" : "secondary"}>
                  {week1Data?.safe_space ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Day 7: Reflection</span>
                <Badge variant={week1Data?.reflection ? "default" : "secondary"}>
                  {week1Data?.reflection ? "Complete" : "Pending"}
                </Badge>
              </div>
            </div>
          </div>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Back to Toolbox
            </Button>
          )}
        </Card>
      </div>
    );
  }

  if (!recoveryPlan) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] p-4">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="mb-6">
            <Sparkles className="mx-auto text-primary mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2">Generate Your Recovery Plan</h2>
            <p className="text-muted-foreground">
              You've completed Week 1! Generate your personalized recovery plan based on your foundation responses.
            </p>
          </div>
          
          <Button 
            onClick={generatePlan} 
            disabled={isGenerating}
            className="mb-4"
          >
            {isGenerating ? 'Generating Plan...' : 'Generate My Recovery Plan'}
          </Button>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Back to Toolbox
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const planData = recoveryPlan.plan_content as any;

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-lg">
                <FileText className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{planData.title}</h1>
                <p className="text-muted-foreground">
                  Generated {new Date(recoveryPlan.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={downloadPlan}>
                <Download size={16} className="mr-2" />
                Download
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Reference */}
        {planData.quickReference && (
          <Card className="mb-6 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-bold mb-4 flex items-center">
              <Heart className="text-primary mr-2" size={20} />
              Quick Reference
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Emergency Contacts</h4>
                <ul className="space-y-1">
                  {planData.quickReference.emergencyContacts?.map((contact: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <Phone size={12} className="mr-2 text-primary" />
                      {contact}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Identity Reminders</h4>
                <div className="flex flex-wrap gap-1">
                  {planData.quickReference.identityReminders?.map((word: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Core Motivation</h4>
                <p className="text-muted-foreground italic">
                  "{planData.quickReference.coreMotivation}"
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <Card className="p-6">
          <Accordion type="single" collapsible defaultValue="mission">
            {planData.sections.map((section: any) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    {getSectionIcon(section.id)}
                    <span className="font-semibold">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-card-foreground">
                        {section.content}
                      </div>
                    </div>
                    
                    {section.keyPoints && section.keyPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Points:</h4>
                        <ul className="space-y-1">
                          {section.keyPoints.map((point: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                              <span className="text-sm">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Footer */}
        <Card className="mt-6 p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            This recovery plan is personalized based on your Week 1 foundation responses. 
            Review and update it regularly as you progress in your journey.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RecoveryPlanViewer;