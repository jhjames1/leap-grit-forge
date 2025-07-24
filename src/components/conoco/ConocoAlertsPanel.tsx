import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ConocoAlertsPanel() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'high-risk',
      title: 'High Risk Session Detected',
      description: 'Engineering department showing increased crisis interventions',
      timestamp: '2024-01-15 14:30',
      severity: 'high',
      acknowledged: false
    },
    {
      id: 2,
      type: 'usage-spike',
      title: 'Usage Spike in HR Department',
      description: '300% increase in EAP utilization over past 7 days',
      timestamp: '2024-01-15 12:15',
      severity: 'medium',
      acknowledged: false
    },
    {
      id: 3,
      type: 'low-engagement',
      title: 'Low Engagement Alert',
      description: 'Sales department utilization below 15% threshold',
      timestamp: '2024-01-15 09:45',
      severity: 'low',
      acknowledged: true
    },
    {
      id: 4,
      type: 'capacity',
      title: 'Approaching Capacity Limit',
      description: 'Current utilization at 85% of available seats',
      timestamp: '2024-01-14 16:20',
      severity: 'medium',
      acknowledged: false
    }
  ]);

  const handleAcknowledge = (alertId: number) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return User;
      default: return AlertTriangle;
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-800 font-oswald">Active Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => {
            const SeverityIcon = getSeverityIcon(alert.severity);
            
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.acknowledged 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <SeverityIcon 
                      className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'high' ? 'text-destructive' :
                        alert.severity === 'medium' ? 'text-orange-500' :
                        'text-muted-foreground'
                      }`} 
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800 font-oswald">{alert.title}</h4>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {alert.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.timestamp}
                      </p>
                    </div>
                  </div>
                  
                  {!alert.acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}