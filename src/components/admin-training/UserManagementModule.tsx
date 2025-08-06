import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, UserPlus, Search, MoreHorizontal, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UserManagementModuleProps {
  onComplete: () => void;
}

const UserManagementModule: React.FC<UserManagementModuleProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '' });
  const [selectedPeer, setSelectedPeer] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const mockUsers = [
    { id: 1, name: "Sarah Martinez", email: "sarah.m@email.com", peer: "Dr. Johnson", status: "active", lastActive: "2 hours ago" },
    { id: 2, name: "Mike Chen", email: "mike.c@email.com", peer: "Lisa Rodriguez", status: "active", lastActive: "1 day ago" },
    { id: 3, name: "Alex Thompson", email: "alex.t@email.com", peer: "Dr. Johnson", status: "inactive", lastActive: "1 week ago" }
  ];

  const mockPeers = [
    { id: 1, name: "Dr. Sarah Johnson", specialty: "Addiction Recovery", caseload: 12 },
    { id: 2, name: "Lisa Rodriguez", specialty: "Mental Health", caseload: 8 },
    { id: 3, name: "Marcus Williams", specialty: "Peer Support", caseload: 15 }
  ];

  const steps = [
    {
      title: "User Management Overview",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Managing LEAP Users 👥</h2>
          
          {/* Current Users List */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Current Users</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Search users..." className="w-64" />
                <Button size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm">Peer: {user.peer}</div>
                        <div className="text-xs text-muted-foreground">Last active: {user.lastActive}</div>
                      </div>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              💡 <strong>User Progress Tracking:</strong> Click on any user to view their recovery journey, 
              engagement metrics, and communication history with their peer specialist.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Adding a New User",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Let's Add a New User 🆕</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  New User Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@email.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setStep(2)}
                  disabled={!newUser.name || !newUser.email}
                >
                  Continue to Peer Assignment
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Registration Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Verify Contact Information</div>
                    <div className="text-sm text-muted-foreground">
                      Ensure email and phone are accurate for critical communications
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Privacy & Consent</div>
                    <div className="text-sm text-muted-foreground">
                      Confirm user understands data usage and has provided consent
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Crisis Contact Info</div>
                    <div className="text-sm text-muted-foreground">
                      Always collect emergency contact information during intake
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
      title: "Assigning a Peer Specialist",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose the Right Peer Specialist 🤝</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Peer Specialists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockPeers.map((peer, index) => (
                  <motion.div
                    key={peer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPeer === peer.name ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPeer(peer.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{peer.name}</div>
                        <div className="text-sm text-muted-foreground">{peer.specialty}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Current Caseload</div>
                        <div className={`text-lg font-bold ${
                          peer.caseload > 12 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {peer.caseload}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Assignment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium mb-2">New User:</div>
                  <div className="text-sm">
                    <div>{newUser.name}</div>
                    <div className="text-muted-foreground">{newUser.email}</div>
                  </div>
                </div>
                
                {selectedPeer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <div className="font-medium mb-2">Assigned Peer:</div>
                    <div className="text-sm">
                      <div>{selectedPeer}</div>
                      <div className="text-muted-foreground">
                        {mockPeers.find(p => p.name === selectedPeer)?.specialty}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowSuccess(true);
                    toast.success("User created successfully!");
                    setTimeout(() => setStep(3), 1000);
                  }}
                  disabled={!selectedPeer}
                >
                  Create User Account
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              🎯 <strong>Matching Tips:</strong> Consider recovery stage, shared experiences, personality compatibility, 
              and current specialist workload for the best user-peer matches.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "User Account Management",
      content: (
        <div>
          <h2 className="text-2xl font-bold mb-6">Managing User Accounts 🔧</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: "View Progress", desc: "Check user's recovery journey and engagement", color: "text-blue-600" },
                  { action: "Update Information", desc: "Modify contact details or preferences", color: "text-green-600" },
                  { action: "Change Peer Assignment", desc: "Reassign to different specialist if needed", color: "text-purple-600" },
                  { action: "Temporary Deactivation", desc: "Pause account for breaks or issues", color: "text-yellow-600" },
                  { action: "Account Termination", desc: "Close account permanently (with proper process)", color: "text-red-600" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                    <div>
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Deactivation Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Alex Thompson</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Inactive for 1 week - may need follow-up
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Contact User</Button>
                      <Button size="sm" variant="outline">Deactivate</Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Remember:</strong> Always document reasons for deactivation and 
                    follow up with users before taking action. Recovery journeys have ups and downs.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Success! {newUser.name} has been added and assigned to {selectedPeer}
                </span>
              </div>
            </motion.div>
          )}
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
                <Badge variant="outline" className="mb-4">Module 3 of 6</Badge>
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

export default UserManagementModule;