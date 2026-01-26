/**
 * Chat message input component
 * Handles text input with Enter key support
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  loading = false
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="bg-card border-t border-border p-4">
      <div className="flex space-x-3">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <Button
          onClick={onSend}
          disabled={disabled || !value.trim() || loading}
          className="bg-primary hover:bg-primary/90"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
};
