
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasToastError: boolean;
}

// Safe wrapper components for toast providers
const SafeToaster = () => {
  try {
    // Check if React hooks are available
    if (typeof React === 'undefined' || !React.useState) {
      console.warn('React hooks not available, skipping Toaster');
      return null;
    }
    
    const { Toaster } = require("@/components/ui/toaster");
    return <Toaster />;
  } catch (error) {
    console.error('Failed to render Toaster:', error);
    return null;
  }
};

const SafeSonner = () => {
  try {
    // Check if React hooks are available
    if (typeof React === 'undefined' || !React.useState) {
      console.warn('React hooks not available, skipping Sonner');
      return null;
    }
    
    const { Toaster: Sonner } = require("@/components/ui/sonner");
    return <Sonner />;
  } catch (error) {
    console.error('Failed to render Sonner:', error);
    return null;
  }
};

class SafeToastProvider extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasToastError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasToastError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Toast provider error:', error, errorInfo);
  }

  render() {
    if (this.state.hasToastError) {
      // Render children without toast components if there's an error
      return this.props.children;
    }

    return (
      <>
        {this.props.children}
        <SafeToaster />
        <SafeSonner />
      </>
    );
  }
}

export { SafeToastProvider };
