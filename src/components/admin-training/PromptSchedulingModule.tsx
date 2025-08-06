import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ArrowRight, Calendar as CalendarIcon, MessageSquare, Mic, Play, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PromptSchedulingModuleProps {
  onComplete: () => void;
}

const PromptSchedulingModule: React.FC<PromptSchedulingModuleProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    content: '',
    type: '',
    time: '',
    frequency: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const mockPrompts = [
    { id: 1, title: "Morning Check-in", type: "text", time: "9:00 AM", status: "active", users: 45 },
    { id: 2, title: "Breathing Exercise", type: "exercise", time: "12:00 PM", status: "active", users: 32 },
    { id: 3, title: "Evening Reflection", type: "audio", time: "7:00 PM", status: "active", users: 28 },
    { id: 4, title: "Gratitude Practice", type: "text", time: "8:00 PM", status: "archived", users: 0 }
  ];

  const steps = [
    {
      title: "Content Scheduling Overview",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Daily Prompts & Content Management 📅</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current Scheduled Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPrompts.map((prompt, index) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {prompt.type === 'text' && <MessageSquare className="h-5 w-5 text-primary" />}
                        {prompt.type === 'audio' && <Mic className="h-5 w-5 text-primary" />}
                        {prompt.type === 'exercise' && <Play className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <div className="font-medium">{prompt.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1)} • {prompt.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm">Active Users</div>
                        <div className="text-lg font-bold">{prompt.users}</div>
                      </div>
                      <Badge variant={prompt.status === 'active' ? 'default' : 'secondary'}>
                        {prompt.status}
                      </Badge>
                      {prompt.status === 'archived' && (
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> Consistent timing helps users build healthy routines. 
              Most effective prompts are sent at the same time each day.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Creating a New Prompt",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Let's Create a New Daily Prompt ✍️</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Prompt Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Midday Motivation"
                    value={newPrompt.title}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Content Type</Label>
                  <Select value={newPrompt.type} onValueChange={(value) => setNewPrompt(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Message</SelectItem>
                      <SelectItem value="audio">Audio Message</SelectItem>
                      <SelectItem value="exercise">Interactive Exercise</SelectItem>
                      <SelectItem value="video">Video Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your motivational message or exercise instructions..."
                    rows={4}
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Delivery Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newPrompt.time}
                      onChange={(e) => setNewPrompt(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newPrompt.frequency} onValueChange={(value) => setNewPrompt(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="How often?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="weekdays">Weekdays Only</SelectItem>
                        <SelectItem value="weekends">Weekends Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="font-medium text-green-700 dark:text-green-300 mb-1">✅ Effective Prompts</div>
                    <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                      <li>• Use encouraging, positive language</li>
                      <li>• Include actionable steps</li>
                      <li>• Keep messages concise (under 200 words)</li>
                      <li>• Make them personally relevant</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="font-medium text-red-700 dark:text-red-300 mb-1">❌ Avoid</div>
                    <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      <li>• Judgmental or preachy tone</li>
                      <li>• Overwhelming or complex tasks</li>
                      <li>• Medical advice or diagnoses</li>
                      <li>• Triggering content without warnings</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="font-medium mb-2">Sample Prompts:</div>
                  <div className="text-sm space-y-2">
                    <div className="p-2 bg-muted rounded text-muted-foreground">
                      "Take 3 deep breaths. What's one thing you're grateful for today?"
                    </div>
                    <div className="p-2 bg-muted rounded text-muted-foreground">
                      "Recovery is a journey, not a destination. How will you show yourself kindness today?"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Scheduling Your Content",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Schedule Your Prompt 📆</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">Start Date: {selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Time: {newPrompt.time || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Frequency: {newPrompt.frequency || 'Not set'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview & Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {newPrompt.title && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="font-medium mb-2">{newPrompt.title}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {newPrompt.type && `Type: ${newPrompt.type.charAt(0).toUpperCase() + newPrompt.type.slice(1)}`}
                    </div>
                    {newPrompt.content && (
                      <div className="text-sm p-3 bg-background border rounded">
                        {newPrompt.content}
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    toast.success("Prompt scheduled successfully!");
                    setStep(2);
                  }}
                  disabled={!newPrompt.title || !newPrompt.content || !newPrompt.type || !newPrompt.time}
                >
                  Schedule Prompt
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <strong>Don't forget to click save!</strong> Your prompt won't be active until you confirm the schedule.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Content Management",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Managing Your Content Library 📚</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Archive Old Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Gratitude Practice</span>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Last sent 2 weeks ago • Low engagement (15%)
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.success("Content archived!")}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Content
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>When to Archive:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Low engagement rates (&lt;20%)</li>
                      <li>• Outdated or seasonal content</li>
                      <li>• User feedback suggests content isn't helpful</li>
                      <li>• Replacing with updated versions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Morning Check-in", engagement: 85, responses: 42 },
                    { title: "Breathing Exercise", engagement: 67, responses: 28 },
                    { title: "Evening Reflection", engagement: 73, responses: 31 }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-sm text-muted-foreground">{item.responses} responses</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${item.engagement}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.engagement}% engagement rate
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Optimization Tip:</strong> Content with &gt;70% engagement is performing well. 
                    Consider creating similar content or A/B testing variations.
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
                <Badge variant="outline" className="mb-4">Module 4 of 6</Badge>
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

export default PromptSchedulingModule;