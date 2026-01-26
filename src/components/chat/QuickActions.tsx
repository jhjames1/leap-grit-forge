/**
 * Quick action buttons for user chat
 * Pre-defined messages for common situations
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import type { QuickActionType } from '@/types/chat';

interface QuickActionsProps {
  onAction: (actionType: QuickActionType) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS: Array<{ type: QuickActionType; label: string; variant: 'default' | 'secondary' }> = [
  { type: 'need-support', label: 'NEED SUPPORT', variant: 'default' },
  { type: 'feeling-triggered', label: 'FEELING TRIGGERED', variant: 'secondary' },
  { type: 'good-day', label: 'GOOD DAY TODAY', variant: 'default' },
  { type: 'question', label: 'QUESTION', variant: 'secondary' }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, disabled = false }) => {
  return (
    <div className="px-4 py-2">
      <div className="flex space-x-2 overflow-x-auto">
        {QUICK_ACTIONS.map(({ type, label, variant }) => (
          <Button
            key={type}
            size="sm"
            onClick={() => onAction(type)}
            disabled={disabled}
            className={`font-fjalla whitespace-nowrap font-light ${
              variant === 'default' 
                ? 'bg-zinc-600 hover:bg-zinc-500 text-zinc-50' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
            }`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
