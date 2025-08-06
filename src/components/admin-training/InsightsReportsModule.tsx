import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, BarChart3, Download, Filter, TrendingUp, TrendingDown, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface InsightsReportsModuleProps {
  onComplete: () => void;
}

const InsightsReportsModule: React.FC<InsightsReportsModuleProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('engagement');

  const mockData = {
    engagement: {
      current: 73,
      previous: 68,
      trend: 'up',
      details: 'Daily check-ins up 12% this week'
    },
    users: {
      active: 247,
      new: 18,
      retention: 84,
      churn: 6
    },
    content: {
      mostEngaging: 'Morning Motivation',
      leastEngaging: 'Evening Reflection',
      avgResponseTime: '2.3 hours'
    },
    concerns: [
      { user: 'Alex P.', issue: 'No activity for 5 days', severity: 'medium' },
      { user: 'Jordan K.', issue: 'Missed 3 consecutive sessions', severity: 'high' },
      { user: 'Taylor S.', issue: 'Low engagement scores', severity: 'low' }
    ]
  };

  const steps = [
    {
      title: "Analytics Dashboard Overview",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Understanding Your Data 📊</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { 
                title: "Active Users", 
                value: mockData.users.active.toString(), 
                change: "+12", 
                icon: Users, 
                color: "text-blue-600" 
              },
              { 
                title: "Engagement Rate", 
                value: `${mockData.engagement.current}%`, 
                change: `+${mockData.engagement.current - mockData.engagement.previous}%`, 
                icon: TrendingUp, 
                color: "text-green-600" 
              },
              { 
                title: "Daily Messages", 
                value: "1,247", 
                change: "+8%", 
                icon: MessageSquare, 
                color: "text-purple-600" 
              },
              { 
                title: "Retention Rate", 
                value: `${mockData.users.retention}%`, 
                change: "+2%", 
                icon: BarChart3, 
                color: "text-orange-600" 
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <Badge variant="outline" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.title}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Daily Check-ins</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                      <span className="text-sm font-medium">73%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Peer Conversations</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '68%'}}></div>
                      </div>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exercise Completion</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">Top Performer</span>
                    </div>
                    <div className="text-sm">Morning Motivation (87% engagement)</div>
                  </div>
                  
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-700 dark:text-red-300">Needs Attention</span>
                    </div>
                    <div className="text-sm">Evening Reflection (23% engagement)</div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Average response time: {mockData.content.avgResponseTime}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              💡 <strong>Reading the Data:</strong> Focus on trends rather than absolute numbers. 
              A consistent upward trend in engagement is more valuable than a single high day.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Interactive Filtering Demo",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Let's Filter Some Data 🔍</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Data Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Time Period</label>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Metric Focus</label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">User Engagement</SelectItem>
                      <SelectItem value="retention">User Retention</SelectItem>
                      <SelectItem value="content">Content Performance</SelectItem>
                      <SelectItem value="peer">Peer Specialist Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">User Segments</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="new">New Users (0-30 days)</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="at-risk">At-Risk Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full" onClick={() => toast.success("Filters applied!")}>
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Filtered Results</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  key={`${selectedTimeframe}-${selectedMetric}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedMetric === 'engagement' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {selectedTimeframe === '7days' ? '73%' : 
                           selectedTimeframe === '30days' ? '68%' : '71%'}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Engagement</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Daily Check-ins</span>
                          <span className="font-medium">85%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Peer Conversations</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Content Interaction</span>
                          <span className="font-medium">54%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedMetric === 'retention' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">84%</div>
                        <div className="text-sm text-muted-foreground">30-Day Retention</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Week 1 Retention</span>
                          <span className="font-medium">96%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Week 2 Retention</span>
                          <span className="font-medium">89%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Month 1 Retention</span>
                          <span className="font-medium">84%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedMetric === 'content' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="font-medium">Best Performing</div>
                        <div className="text-sm">Morning Motivation: 87%</div>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="font-medium">Average</div>
                        <div className="text-sm">Breathing Exercise: 45%</div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="font-medium">Needs Improvement</div>
                        <div className="text-sm">Evening Reflection: 23%</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Identifying Trends & Red Flags",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Spotting Important Patterns 🔍</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Users Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.concerns.map((concern, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 border rounded-lg ${
                        concern.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                        concern.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-gray-300 bg-gray-50 dark:bg-gray-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{concern.user}</div>
                          <div className="text-sm text-muted-foreground">{concern.issue}</div>
                        </div>
                        <Badge variant={
                          concern.severity === 'high' ? 'destructive' :
                          concern.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {concern.severity}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <Button className="w-full mt-4" variant="outline">
                  View All Flagged Users (12)
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Positive Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Engagement Increase</span>
                  </div>
                  <div className="text-sm">Overall engagement up 12% this month</div>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">User Growth</span>
                  </div>
                  <div className="text-sm">18 new active users this week</div>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Peer Connections</span>
                  </div>
                  <div className="text-sm">Avg. peer response time improved to 2.3 hours</div>
                </div>
                
                <div className="text-sm text-muted-foreground mt-4">
                  <strong>Key Insight:</strong> Morning content performs 3x better than evening content. 
                  Consider shifting more resources to morning engagement.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Exporting Data & Reports",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Generate Reports for Stakeholders 📋</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    title: "Executive Summary", 
                    desc: "High-level metrics for leadership", 
                    format: "PDF",
                    icon: "📊" 
                  },
                  { 
                    title: "Detailed Analytics", 
                    desc: "Complete data set for analysis", 
                    format: "CSV",
                    icon: "📈" 
                  },
                  { 
                    title: "User Progress Report", 
                    desc: "Individual user journeys & outcomes", 
                    format: "PDF",
                    icon: "👥" 
                  },
                  { 
                    title: "Content Performance", 
                    desc: "Engagement metrics by content type", 
                    format: "Excel",
                    icon: "📝" 
                  }
                ].map((report, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{report.icon}</span>
                      <div>
                        <div className="font-medium">{report.title}</div>
                        <div className="text-sm text-muted-foreground">{report.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.format}</Badge>
                      <Button size="sm" onClick={() => toast.success(`${report.title} exported!`)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Report Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">📅 Regular Reporting</div>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      <li>• Weekly summaries for program staff</li>
                      <li>• Monthly reports for leadership</li>
                      <li>• Quarterly reviews for funders</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="font-medium text-green-700 dark:text-green-300 mb-1">🎯 Focus on Outcomes</div>
                    <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                      <li>• User recovery progress</li>
                      <li>• Engagement quality over quantity</li>
                      <li>• Crisis prevention success</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">🔒 Privacy Protection</div>
                    <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                      <li>• Aggregate data only</li>
                      <li>• No personal identifiers</li>
                      <li>• HIPAA-compliant formats</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                    <strong>Pro Tip:</strong> Include trend explanations and actionable recommendations 
                    in every report. Data tells a story - help stakeholders understand it.
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
                <Badge variant="outline" className="mb-4">Module 6 of 6</Badge>
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

export default InsightsReportsModule;