/**
 * Chat connection status indicator
 * Shows real-time connection state with reconnect option
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '@/types/chat';

interface ChatConnectionStatusProps {
  connectionStatus: ConnectionStatus;
  onReconnect: () => void;
  compact?: boolean;
}

export const ChatConnectionStatus: React.FC<ChatConnectionStatusProps> = ({
  connectionStatus,
  onReconnect,
  compact = false
}) => {
  const { status, isConnected, error } = connectionStatus;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {status === 'connecting' && (
          <Loader2 size={12} className="text-muted-foreground animate-spin" />
        )}
        {isConnected && (
          <Wifi size={12} className="text-chat-active" />
        )}
        {status === 'error' && (
          <WifiOff size={12} className="text-destructive cursor-pointer" onClick={onReconnect} />
        )}
        {status === 'disconnected' && (
          <WifiOff size={12} className="text-muted-foreground" />
        )}
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="bg-muted/50 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Connecting to real-time...</p>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-chat-active/10 border-b border-chat-active/20 p-3">
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-chat-active" />
          <p className="text-sm text-chat-active">Connected - Messages appear instantly</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'disconnected') {
    return (
      <div className="bg-warning/10 border-b border-warning/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-warning" />
            <p className="text-sm text-warning">
              {error || 'Disconnected'} - Messages may be delayed
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onReconnect}
            className="border-warning text-warning hover:bg-warning/10"
          >
            <RefreshCw size={14} className="mr-1" />
            Reconnect
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
