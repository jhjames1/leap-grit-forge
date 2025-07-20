
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ChatErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Chat Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ChatErrorBoundary'
    });

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="p-6 m-4 bg-red-50 border-red-200">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Chat Error
            </h3>
            <p className="text-red-600 mb-4">
              Something went wrong with the chat feature. 
              {this.state.retryCount > 0 && (
                <span className="block text-sm mt-1">
                  Retry attempt {this.state.retryCount} of {this.maxRetries}
                </span>
              )}
            </p>
            
            <div className="space-y-2">
              {this.state.retryCount < this.maxRetries && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="mr-2"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={this.handleReset}
                variant="outline"
              >
                <MessageCircle size={16} className="mr-2" />
                Reset Chat
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-red-100 text-red-800 text-xs overflow-auto rounded">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-2 bg-red-100 text-red-800 text-xs overflow-auto rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
