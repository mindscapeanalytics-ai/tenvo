'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

/**
 * Production-ready Error Boundary Component
 * Catches React errors and provides graceful fallback UI
 * 
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to error reporting service (e.g., Sentry, LogRocket)
        console.error('ErrorBoundary caught error:', {
            error,
            errorInfo,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
        });

        this.setState({ errorInfo });

        // TODO: Send to error tracking service
        // trackError(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        this.props.onReset?.();
    };

    override render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default production-ready fallback UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <Card className="max-w-2xl w-full border-red-200 bg-red-50/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-red-900">
                                        Something went wrong
                                    </CardTitle>
                                    <CardDescription className="text-red-700">
                                        We encountered an unexpected error. Please try again.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-white border border-red-200 rounded-lg p-4">
                                    <p className="text-sm font-mono text-red-800 mb-2">
                                        <strong>Error:</strong> {this.state.error.message}
                                    </p>
                                    {this.state.error.stack && (
                                        <details className="text-xs font-mono text-gray-600">
                                            <summary className="cursor-pointer text-red-700 font-semibold mb-2">
                                                Stack Trace
                                            </summary>
                                            <pre className="whitespace-pre-wrap overflow-auto max-h-48 bg-gray-50 p-2 rounded">
                                                {this.state.error.stack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleReset}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for easier usage
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
