import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, MessageSquare, AlertTriangle, Shield, Phone, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ChatEscalationModuleProps {
  onComplete: () => void;
}

const ChatEscalationModule: React.FC<ChatEscalationModuleProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [escalationNote, setEscalationNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const mockChat = [
    { sender: "Sarah", message: "I've been feeling really overwhelmed lately...", time: "2:30 PM", type: "user" },
    { sender: "Mike (Peer)", message: "I understand that feeling. What's been the biggest source of stress?", time: "2:32 PM", type: "peer" },
    { sender: "Sarah", message: "Everything feels pointless. I can't see why I should keep trying.", time: "2:35 PM", type: "user", flag: "concerning" },
    { sender: "Mike (Peer)", message: "That sounds really tough. Have you been having thoughts of hurting yourself?", time: "2:37 PM", type: "peer", flag: "good-response" },
    { sender: "Sarah", message: "Sometimes I think everyone would be better off without me", time: "2:40 PM", type: "user", flag: "crisis" }
  ];

  const escalationActions = [
    { 
      id: 'immediate', 
      title: 'Immediate Crisis Intervention', 
      description: 'Contact emergency services and crisis hotline',
      severity: 'high',
      icon: Phone
    },
    { 
      id: 'supervisor', 
      title: 'Notify Clinical Supervisor', 
      description: 'Alert licensed clinician for guidance',
      severity: 'high',
      icon: AlertTriangle
    },
    { 
      id: 'safety-plan', 
      title: 'Activate Safety Plan', 
      description: 'Review user\'s safety plan and coping strategies',
      severity: 'medium',
      icon: Shield
    },
    { 
      id: 'document', 
      title: 'Document Incident', 
      description: 'Create detailed incident report for records',
      severity: 'medium',
      icon: FileText
    }
  ];

  const steps = [
    {
      title: "Chat Monitoring Overview",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Monitoring Peer-to-Peer Conversations 👀</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { users: "Sarah M. ↔ Mike D.", status: "active", lastMessage: "2 min ago", flag: "crisis" },
                    { users: "Alex P. ↔ Lisa R.", status: "active", lastMessage: "15 min ago", flag: "normal" },
                    { users: "Jordan K. ↔ Marcus W.", status: "paused", lastMessage: "1 hour ago", flag: "normal" },
                    { users: "Taylor S. ↔ Dr. Johnson", status: "active", lastMessage: "5 min ago", flag: "concerning" }
                  ].map((chat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        chat.flag === 'crisis' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                        chat.flag === 'concerning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                        'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{chat.users}</div>
                          <div className="text-sm text-muted-foreground">Last message: {chat.lastMessage}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            chat.flag === 'crisis' ? 'destructive' :
                            chat.flag === 'concerning' ? 'secondary' :
                            'default'
                          }>
                            {chat.flag === 'crisis' ? 'CRISIS' :
                             chat.flag === 'concerning' ? 'Review' :
                             'Normal'}
                          </Badge>
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="font-medium text-red-700 dark:text-red-300 mb-1">🚨 Immediate Escalation</div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      <li>• Suicide ideation or self-harm</li>
                      <li>• Threats of violence</li>
                      <li>• Medical emergencies</li>
                      <li>• Abuse disclosures</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">⚠️ Monitor Closely</div>
                    <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                      <li>• Emotional distress</li>
                      <li>• Relapse concerns</li>
                      <li>• Boundary issues</li>
                      <li>• Peer specialist concerns</li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <strong>HIPAA Reminder:</strong> All conversations are confidential. 
                  Only escalate when safety is at risk or clinical guidance is needed.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Crisis Chat Scenario",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Crisis Situation Demo 🚨</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat: Sarah M. ↔ Mike D.
                  <Badge variant="destructive">CRISIS ALERT</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {mockChat.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`p-3 rounded-lg ${
                        msg.type === 'user' ? 'bg-muted ml-4' : 'bg-primary/10 mr-4'
                      } ${
                        msg.flag === 'crisis' ? 'border-2 border-red-500' :
                        msg.flag === 'concerning' ? 'border border-yellow-500' :
                        msg.flag === 'good-response' ? 'border border-green-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{msg.sender}</span>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.flag === 'crisis' && (
                        <div className="mt-2 text-xs text-red-600 font-medium">
                          ⚠️ SUICIDE IDEATION DETECTED
                        </div>
                      )}
                      {msg.flag === 'good-response' && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✅ Appropriate screening question
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Immediate Action Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="font-medium text-red-700 dark:text-red-300 mb-2">
                      Crisis Indicators Detected:
                    </div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      <li>• Expressed hopelessness</li>
                      <li>• Thoughts of being a burden</li>
                      <li>• Passive suicide ideation</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="font-medium text-green-700 dark:text-green-300 mb-2">
                      Peer Response Assessment:
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Mike responded appropriately by directly asking about self-harm. 
                      Good crisis intervention technique.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      onClick={() => setStep(2)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Escalate This Situation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Escalation Process",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Crisis Escalation Actions 🚑</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Required Actions (Select All That Apply)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {escalationActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAction === action.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAction(action.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          action.severity === 'high' ? 'bg-red-100 dark:bg-red-950/20' : 'bg-yellow-100 dark:bg-yellow-950/20'
                        }`}>
                          <action.icon className={`h-5 w-5 ${
                            action.severity === 'high' ? 'text-red-600' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">{action.description}</div>
                          {action.severity === 'high' && (
                            <Badge variant="destructive" className="mt-2">High Priority</Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Incident Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Incident Summary</Label>
                    <Textarea
                      placeholder="Document the crisis situation, user statements, and immediate actions taken..."
                      rows={6}
                      value={escalationNote}
                      onChange={(e) => setEscalationNote(e.target.value)}
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">Documentation Tips:</div>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      <li>• Include exact quotes when possible</li>
                      <li>• Note time stamps and actions taken</li>
                      <li>• Avoid personal opinions or judgments</li>
                      <li>• Include follow-up plans</li>
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast.success("Crisis escalation initiated!");
                      setStep(3);
                    }}
                    disabled={!selectedAction || !escalationNote}
                  >
                    Submit Escalation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Follow-up & Prevention",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Post-Crisis Follow-up 📋</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { task: "Verify user safety", completed: true, priority: "high" },
                    { task: "Clinical supervisor notified", completed: true, priority: "high" },
                    { task: "Incident report filed", completed: true, priority: "medium" },
                    { task: "Safety plan updated", completed: false, priority: "medium" },
                    { task: "Peer specialist debriefing", completed: false, priority: "low" },
                    { task: "Schedule follow-up check-in", completed: false, priority: "medium" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 
                        'bg-muted/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        item.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
                      }`}>
                        {item.completed && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1">
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.task}</span>
                      </div>
                      <Badge variant={
                        item.priority === 'high' ? 'destructive' :
                        item.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {item.priority}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Prevention Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="font-medium mb-2">Early Warning Systems</div>
                    <ul className="text-sm space-y-1">
                      <li>• Monitor for mood pattern changes</li>
                      <li>• Track engagement drop-offs</li>
                      <li>• Set up automated risk alerts</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="font-medium mb-2">Peer Specialist Training</div>
                    <ul className="text-sm space-y-1">
                      <li>• Crisis recognition skills</li>
                      <li>• De-escalation techniques</li>
                      <li>• When and how to escalate</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="font-medium mb-2">User Safety Resources</div>
                    <ul className="text-sm space-y-1">
                      <li>• Updated safety plans</li>
                      <li>• Crisis hotline integration</li>
                      <li>• Emergency contact systems</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-green-700 dark:text-green-300 text-sm">
                    <strong>Remember:</strong> Quick, appropriate responses save lives. 
                    When in doubt, always err on the side of safety and escalate.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            <CardContent className="p-0">
              <div className="mb-6">
                <Badge variant="outline" className="mb-4">Module 5 of 6</Badge>
                <h1 className="text-3xl font-bold">{steps[step].title}</h1>
              </div>
              
              {steps[step].content}
              
              <div className="flex justify-between mt-8">
                <Button
                  onClick={() => step > 0 ? setStep(step - 1) : null}
                  variant="outline"
                  disabled={step === 0}
                >
                  Previous
                </Button>
                <Button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}>
                  {step === steps.length - 1 ? 'Complete Module' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium ${className}`}>{children}</label>
);

export default ChatEscalationModule;