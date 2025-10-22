/**
 * Employer/EAP Analytics Portal
 * Entry point for enterprise employer analytics access
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Shield, AlertCircle } from 'lucide-react';
import EmployerAnalyticsDashboard from '@/components/EmployerAnalyticsDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const EmployerPortal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [baaAccepted, setBaaAccepted] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    // TODO: Implement proper access check against employer_coordinators table
    // For now, demo mode with mock data
    
    // Mock: Check if user has employer coordinator role
    // In production, query: SELECT * FROM employer_coordinators WHERE user_id = auth.uid()
    
    setOrgId('conocophillips');
    setOrgName('ConocoPhillips');
    setBaaAccepted(true); // TODO: Check actual BAA status
    setHasAccess(true);
    setLoading(false);
  };

  const handleAcceptBAA = () => {
    // TODO: Implement BAA acceptance workflow
    setBaaAccepted(true);
  };

  if (!user) {
    return <Navigate to="/conoco-login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto mt-20">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You do not have permissions to access employer analytics.
                Please contact your EAP coordinator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!baaAccepted) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Business Associate Agreement (BAA)
              </CardTitle>
              <CardDescription>
                HIPAA Compliance & Data Privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p>
                  Before accessing employee recovery analytics, you must acknowledge and accept the 
                  Business Associate Agreement (BAA) which governs the use of protected health information (PHI).
                </p>
                
                <h3>Key Terms:</h3>
                <ul>
                  <li><strong>Data Minimization</strong>: Only aggregated, anonymized data is displayed</li>
                  <li><strong>Minimum Cohort Size</strong>: Metrics require at least 10 users to protect individual privacy</li>
                  <li><strong>No PII/PHI</strong>: Individual names, contact information, or health details are never exposed</li>
                  <li><strong>Audit Trail</strong>: All access is logged for compliance purposes</li>
                  <li><strong>Authorized Use Only</strong>: Data may only be used for evaluating program effectiveness</li>
                </ul>

                <h3>Your Responsibilities:</h3>
                <ul>
                  <li>Do not attempt to identify individual users</li>
                  <li>Do not share analytics access credentials</li>
                  <li>Do not export data outside approved channels</li>
                  <li>Report any suspected privacy breaches immediately</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAcceptBAA} className="w-full">
                  I Accept the BAA Terms
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Employer Analytics Portal</h1>
            <p className="text-muted-foreground text-sm">
              HIPAA-compliant recovery program insights
            </p>
          </div>
        </div>

        {orgId && orgName && (
          <EmployerAnalyticsDashboard orgId={orgId} orgName={orgName} />
        )}
      </div>
    </div>
  );
};

export default EmployerPortal;
