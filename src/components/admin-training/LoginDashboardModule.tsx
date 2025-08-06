import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lock, Eye, Users, MessageSquare, Calendar, BarChart3, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginDashboardModuleProps {
  onComplete: () => void;
}

const LoginDashboardModule: React.FC<LoginDashboardModuleProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const steps = [
    {
      title: "Admin Portal Login",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Let's Log Into the Admin Portal</h2>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                LEAP Admin Login
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourorg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => setStep(1)}
                disabled={!email || !password}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> In the real portal, you'll use your organization's admin credentials. 
              Always keep your login secure and never share with unauthorized users.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Dashboard Overview",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Welcome to Your Dashboard! 🎯</h2>
          
          {/* Mock Dashboard */}
          <div className="bg-gradient-to-br from-background to-muted/30 border rounded-lg p-6">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Users, label: "Active Users", value: "247", color: "text-blue-600" },
                { icon: MessageSquare, label: "Daily Chats", value: "89", color: "text-green-600" },
                { icon: Calendar, label: "Scheduled Prompts", value: "12", color: "text-purple-600" },
                { icon: Bell, label: "Alerts", value: "3", color: "text-orange-600" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setShowTooltip(stat.label)}
                  onHoverEnd={() => setShowTooltip(null)}
                  className="relative"
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                  
                  {showTooltip === stat.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-black text-white text-xs rounded z-10"
                    >
                      Click to view detailed {stat.label.toLowerCase()}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: Users, label: "Add New User", desc: "Register a new LEAP user" },
                    { icon: Calendar, label: "Schedule Content", desc: "Create daily prompts & exercises" },
                    { icon: MessageSquare, label: "Monitor Chats", desc: "Review peer conversations" },
                    { icon: BarChart3, label: "View Reports", desc: "Analyze engagement data" }
                  ].map((action, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    >
                      <action.icon className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{action.label}</div>
                        <div className="text-sm text-muted-foreground">{action.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { user: "Sarah M.", action: "completed daily check-in", time: "5 min ago", type: "success" },
                    { user: "Mike D.", action: "missed scheduled session", time: "1 hour ago", type: "warning" },
                    { user: "Alex P.", action: "requested peer support", time: "2 hours ago", type: "info" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </div>
                      <span className="text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              🎯 <strong>Key Areas:</strong> Your dashboard gives you a bird's-eye view of user engagement, 
              pending actions, and system health. The sidebar navigation (left) will be your main way to access different tools.
            </p>
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
                <Badge variant="outline" className="mb-4">Module 2 of 6</Badge>
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

export default LoginDashboardModule;