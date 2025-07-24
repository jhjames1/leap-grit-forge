
import React, { Component, ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface Props {
  children: ReactNode;
}

interface State {
  hasToastError: boolean;
}

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
        <Toaster />
        <Sonner />
      </>
    );
  }
}

export { SafeToastProvider };
