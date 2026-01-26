/**
 * Shared chat message display component
 * Used by both user and specialist chat interfaces
 */

import React from 'react';
import { Phone, CheckCircle } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isOwnMessage }) => {
  const isSystem = message.message_type === 'system';
  const isPhoneRequest = message.message_type === 'phone_call_request';

  // Phone call request styling
  if (isPhoneRequest) {
    return (
      <div className="flex flex-col items-center">
        <div className="max-w-[90%] bg-construction/10 border-2 border-construction/30 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="text-construction" size={18} />
            <p className="text-construction font-oswald font-semibold">Phone Call Request</p>
          </div>
          <p className="text-muted-foreground text-sm mb-2">{message.content}</p>
          <p className="text-xs text-muted-foreground/70">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    );
  }

  // System message styling
  if (isSystem) {
    return (
      <div className="flex flex-col items-center">
        <div className="max-w-[80%] bg-muted/50 text-muted-foreground border border-border rounded-2xl p-4">
          <p className="text-sm leading-relaxed mb-1">{message.content}</p>
          <p className="text-xs text-muted-foreground/70">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    );
  }

  // Regular message styling
  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[80%] rounded-2xl p-4 ${
        isOwnMessage 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-card border border-border text-card-foreground'
      }`}>
        <p className="text-sm leading-relaxed mb-1">{message.content}</p>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs ${
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {isOwnMessage && message.id.startsWith('temp-') && (
            <span className="text-xs opacity-50">Sending...</span>
          )}
          {isOwnMessage && !message.id.startsWith('temp-') && (
            <CheckCircle size={12} className="opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
};
