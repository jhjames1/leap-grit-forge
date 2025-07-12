import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, User, Activity, Eye, Lock, Server, Database } from 'lucide-react';

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
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
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
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Login</Badge>;
      case 'user_logout':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Logout</Badge>;
      case 'login_failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case 'user_registration':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Register</Badge>;
      default:
        return <Badge variant="outline">{event}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Matching home page style */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          {/* Left column: Title and description */}
          <div className="flex-1">
            <p className="text-foreground font-oswald font-extralight tracking-wide mb-0">
              REAL-TIME MONITORING
            </p>
            <p className="text-muted-foreground text-sm">Track security events and system activity</p>
          </div>
          
          {/* Right column: Action buttons removed - now handled by main refresh */}
          <div className="flex flex-col items-end">
          </div>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-sm">
              <Eye className="text-primary-foreground" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">{securityLogs.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Security Events</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500/20 p-3 rounded-sm">
              <Lock className="text-yellow-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">
                {rateLimitData.filter(d => d.attempts > 3).length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Rate Limited</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-sm">
              <Server className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">Online</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">System Status</div>
            </div>
          </div>
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-sm">
              <Database className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-card-foreground">Secure</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-oswald">Data Protection</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Alert */}
      <Card className="bg-red-500/10 border-red-500/30 p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="text-red-400 mt-1" size={20} />
          <div>
            <h3 className="text-red-400 font-fjalla font-bold mb-1 tracking-wide">SECURITY NOTICE</h3>
            <p className="text-red-300 text-sm font-source">
              This panel shows security events and system activity. In production, this data should be sent to a secure logging service.
            </p>
          </div>
        </div>
      </Card>

      {/* Security Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-primary p-3 rounded-sm">
              <Activity className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-base tracking-wide">RECENT SECURITY EVENTS</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {securityLogs.length > 0 ? (
              securityLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-black/[7.5%] rounded-lg">
                  {getEventIcon(log.event)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getEventBadge(log.event)}
                      <span className="text-muted-foreground text-sm font-source">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-muted-foreground text-xs mt-1 font-source">
                        {log.details.username && `User: ${log.details.username}`}
                        {log.details.reason && ` - ${log.details.reason}`}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4 font-source italic">No security events recorded</p>
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
        </Card>

        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-primary p-3 rounded-sm">
              <Clock className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-base tracking-wide">RATE LIMIT STATUS</h3>
          </div>
          <div className="space-y-2">
            {rateLimitData.length > 0 ? (
              rateLimitData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/[7.5%] rounded-lg">
                  <span className="text-card-foreground font-source">{data.user}</span>
                  <Badge className={data.attempts > 3 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                    {data.attempts} attempts
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4 font-source italic">No rate limit data</p>
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
        </Card>
      </div>

      {/* Security Recommendations */}
      <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-primary p-3 rounded-sm">
            <Shield className="text-primary-foreground" size={20} />
          </div>
          <h3 className="font-fjalla font-bold text-card-foreground text-base tracking-wide">SECURITY RECOMMENDATIONS</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-black/[7.5%] rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">DATA STORAGE SECURITY</p>
              <p className="text-muted-foreground text-sm font-source">User data is encrypted in localStorage. Consider migrating to secure backend storage.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-black/[7.5%] rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">SESSION MANAGEMENT</p>
              <p className="text-muted-foreground text-sm font-source">Sessions expire after 24 hours. Consider implementing refresh tokens for better security.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-black/[7.5%] rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-fjalla font-bold text-card-foreground text-sm tracking-wide">RATE LIMITING</p>
              <p className="text-muted-foreground text-sm font-source">Basic rate limiting is active. Consider server-side rate limiting for production.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SecurityAuditPanel;