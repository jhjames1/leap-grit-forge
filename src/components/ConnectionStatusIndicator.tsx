
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/useRobustRealtimeConnection';

interface ConnectionStatusIndicatorProps {
  connectionStatus: ConnectionStatus;
  onReconnect: () => void;
  compact?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  connectionStatus,
  onReconnect,
  compact = false
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: <Wifi className="w-3 h-3" />,
          text: compact ? '' : 'Connected',
          bgColor: 'bg-green-500'
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          icon: <RefreshCw className="w-3 h-3 animate-spin" />,
          text: compact ? '' : 'Connecting...',
          bgColor: 'bg-yellow-500'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertCircle className="w-3 h-3" />,
          text: compact ? '' : 'Connection Error',
          bgColor: 'bg-red-500'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <WifiOff className="w-3 h-3" />,
          text: compact ? '' : 'Disconnected',
          bgColor: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full ${config.bgColor}`}
          title={`Connection: ${connectionStatus.status}`}
        />
        {connectionStatus.status === 'error' && connectionStatus.retryCount < 5 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReconnect}
            className="h-6 w-6 p-0"
            title="Reconnect"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.text}
        {connectionStatus.quality !== 'unknown' && (
          <span className="text-xs">
            ({connectionStatus.quality})
          </span>
        )}
      </Badge>
      
      {connectionStatus.status === 'error' && connectionStatus.retryCount < 5 && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReconnect}
          className="h-6 px-2"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
      
      {connectionStatus.error && (
        <span className="text-xs text-muted-foreground" title={connectionStatus.error}>
          {connectionStatus.retryCount > 0 && `(${connectionStatus.retryCount} retries)`}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
