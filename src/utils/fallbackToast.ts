// Fallback toast implementation when the main toast system is disabled
// This prevents the app from crashing when toast functions are called

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple fallback toast that uses browser notifications or console logging
export const fallbackToast = (options: ToastOptions) => {
  const message = options.title || options.description || 'Notification';
  
  // Try to use browser notifications if available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(message);
    return;
  }
  
  // Fall back to console with visual styling
  const style = options.variant === 'destructive' 
    ? 'color: red; font-weight: bold;' 
    : 'color: green; font-weight: bold;';
    
  console.log(`%c${message}`, style);
  
  // Also try to create a temporary visual notification
  try {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${options.variant === 'destructive' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  } catch (error) {
    // If all else fails, just log it
    console.log('Notification:', message);
  }
};

// Export as useToast hook compatibility layer
export const useFallbackToast = () => ({
  toast: fallbackToast,
  toasts: [],
  dismiss: () => {}
});