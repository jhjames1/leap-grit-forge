import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

export function TestConfirmationScreen() {
  const [view, setView] = useState<'loading' | 'success' | 'error'>('loading');

  const showLoading = () => setView('loading');
  const showSuccess = () => setView('success');
  const showError = () => setView('error');

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold">Confirming your email...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we verify your email address.
            </p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={showSuccess}>Show Success</Button>
              <Button variant="outline" onClick={showError}>Show Error</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Email Confirmed!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Welcome to LEAP!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to the app in a few seconds...
            </p>
            <div className="space-y-2">
              <Button className="w-full">
                Go to App
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={showLoading}>Back to Loading</Button>
                <Button variant="outline" onClick={showError}>Show Error</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Confirmation Failed</CardTitle>
          <CardDescription>
            There was a problem confirming your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-destructive">
            <AlertDescription className="text-destructive">
              The confirmation link may have expired or is invalid. Please try signing up again.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <Button className="w-full">
              Back to Login
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={showLoading}>Show Loading</Button>
              <Button variant="outline" onClick={showSuccess}>Show Success</Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              If you continue to have issues, try signing up again or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}