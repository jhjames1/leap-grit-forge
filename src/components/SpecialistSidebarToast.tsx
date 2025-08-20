import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastNotification {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

const getToastIcon = (variant: string = 'default') => {
  switch (variant) {
    case 'destructive':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

const getToastStyles = (variant: string = 'default') => {
  switch (variant) {
    case 'destructive':
      return 'border-destructive/20 bg-destructive/5';
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    default:
      return 'border-border bg-background';
  }
};

export function SpecialistSidebarToast() {
  const { toasts, dismiss } = useToast();
  const [sidebarToasts, setSidebarToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Convert useToast toasts to our format and filter for specialist notifications
    const specialistToasts = toasts
      .filter(toast => 
        // Show toasts that are likely specialist-related based on content
        toast.title?.toString().toLowerCase().includes('session') ||
        toast.title?.toString().toLowerCase().includes('appointment') ||
        toast.title?.toString().toLowerCase().includes('proposal') ||
        toast.title?.toString().toLowerCase().includes('chat') ||
        toast.description?.toString().toLowerCase().includes('session') ||
        toast.description?.toString().toLowerCase().includes('appointment') ||
        toast.description?.toString().toLowerCase().includes('proposal') ||
        toast.description?.toString().toLowerCase().includes('chat')
      )
      .map(toast => ({
        id: toast.id,
        title: toast.title?.toString(),
        description: toast.description?.toString(),
        variant: toast.variant as ToastNotification['variant'] || 'default',
        duration: 5000 // 5 seconds default
      }));

    setSidebarToasts(specialistToasts);
  }, [toasts]);

  useEffect(() => {
    // Auto-dismiss toasts after their duration
    sidebarToasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dismiss(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [sidebarToasts, dismiss]);

  const notificationContainer = document.getElementById('specialist-notifications');
  if (!notificationContainer || sidebarToasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="space-y-2">
      {sidebarToasts.map((toast) => (
        <Card 
          key={toast.id} 
          className={cn(
            'w-full shadow-sm transition-all duration-300 ease-in-out',
            getToastStyles(toast.variant)
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              {getToastIcon(toast.variant)}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {toast.title}
                  </p>
                )}
                {toast.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    {toast.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted/50"
                onClick={() => dismiss(toast.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>,
    notificationContainer
  );
}