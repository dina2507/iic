import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    // TODO: Send error to Sentry or another error monitoring service
    // if (process.env.NODE_ENV === "production") {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-8">
              We apologize for the inconvenience. An unexpected error has occurred in the application.
            </p>

            <Button 
              onClick={() => window.location.reload()}
              className="w-full mb-6 gap-2"
              size="lg"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </Button>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-6 text-left">
                <details className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                  <summary className="font-semibold text-muted-foreground cursor-pointer mb-2">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="text-destructive whitespace-pre-wrap mt-2">
                    {this.state.error.toString()}
                  </pre>
                  <pre className="text-muted-foreground whitespace-pre-wrap mt-4">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
