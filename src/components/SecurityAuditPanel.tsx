import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, User, Activity } from 'lucide-react';

interface SecurityLog {
  timestamp: string;
  event: string;
  details?: any;
  userAgent: string;
  url: string;
}

const SecurityAuditPanel = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [rateLimitData, setRateLimitData] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = () => {
    // Load security logs
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    setSecurityLogs(logs.slice(-20)); // Show last 20 events

    // Load rate limit data
    const rateLimits = Object.keys(localStorage)
      .filter(key => key.startsWith('rate_limit_'))
      .map(key => ({
        user: key.replace('rate_limit_', ''),
        attempts: JSON.parse(localStorage.getItem(key) || '[]').length
      }));
    setRateLimitData(rateLimits);
  };

  const clearSecurityLogs = () => {
    localStorage.removeItem('security_logs');
    setSecurityLogs([]);
  };

  const clearRateLimitData = () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('rate_limit_'))
      .forEach(key => localStorage.removeItem(key));
    setRateLimitData([]);
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'user_login':
        return <User className="h-4 w-4 text-green-400" />;
      case 'user_logout':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'login_failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'user_registration':
        return <User className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventBadge = (event: string) => {
    switch (event) {
      case 'user_login':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-400">Login</Badge>;
      case 'user_logout':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">Logout</Badge>;
      case 'login_failed':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-400">Failed</Badge>;
      case 'user_registration':
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">Register</Badge>;
      default:
        return <Badge variant="outline">{event}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-construction" />
        <h2 className="text-xl font-bold text-white">Security Audit Panel</h2>
      </div>

      <Alert className="bg-steel-dark border-steel">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-steel-light">
          This panel shows security events and system activity. In production, this data should be sent to a secure logging service.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-midnight border-steel-dark">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {securityLogs.length > 0 ? (
                securityLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-steel-dark/50 rounded">
                    {getEventIcon(log.event)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getEventBadge(log.event)}
                        <span className="text-steel-light text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-steel-light text-xs mt-1">
                          {log.details.username && `User: ${log.details.username}`}
                          {log.details.reason && ` - ${log.details.reason}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-steel-light text-center py-4">No security events recorded</p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSecurityLogs}
              className="mt-4 w-full"
            >
              Clear Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-midnight border-steel-dark">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rate Limit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rateLimitData.length > 0 ? (
                rateLimitData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-steel-dark/50 rounded">
                    <span className="text-steel-light">{data.user}</span>
                    <Badge variant={data.attempts > 3 ? "destructive" : "secondary"}>
                      {data.attempts} attempts
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-steel-light text-center py-4">No rate limit data</p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearRateLimitData}
              className="mt-4 w-full"
            >
              Clear Rate Limits
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-midnight border-steel-dark">
        <CardHeader>
          <CardTitle className="text-white">Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-steel-light text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium">Data Storage Security</p>
                <p>User data is encrypted in localStorage. Consider migrating to secure backend storage.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium">Session Management</p>
                <p>Sessions expire after 24 hours. Consider implementing refresh tokens for better security.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium">Rate Limiting</p>
                <p>Basic rate limiting is active. Consider server-side rate limiting for production.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditPanel;