// Utility to ensure consistent React imports across the app
// This helps prevent React becoming null in hook contexts

export const ensureReactAvailable = () => {
  if (typeof React === 'undefined') {
    console.error('React is not available in global context');
    return false;
  }
  return true;
};

// Re-export React consistently
import * as React from 'react';
export { React };
export default React;