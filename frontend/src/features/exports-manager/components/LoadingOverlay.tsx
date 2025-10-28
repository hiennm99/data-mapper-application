// LoadingOverlay.tsx - Loading state for exports manager
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    type?: 'loading' | 'error' | 'retrying';
    message?: string;
    onRetry?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
    isVisible, 
    type = 'loading',
    message,
    onRetry 
}) => {
    if (!isVisible) return null;

    const getContent = () => {
        switch (type) {
            case 'error':
                return (
                    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Connection Error
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {message || 'Unable to connect to the server. The backend might be starting up or experiencing issues.'}
                            </p>
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Connection
                                </button>
                            )}
                            <p className="text-sm text-gray-500 mt-4">
                                💡 Tip: If using Railway free tier, the first request may take 30-60 seconds to wake up the server.
                            </p>
                        </div>
                    </div>
                );

            case 'retrying':
                return (
                    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Retrying Connection...
                            </h3>
                            <p className="text-gray-600">
                                {message || 'Attempting to reconnect to the server...'}
                            </p>
                        </div>
                    </div>
                );

            default: // loading
                return (
                    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Loading Data...
                            </h3>
                            <p className="text-gray-600">
                                {message || 'Fetching exports from the server...'}
                            </p>
                            <div className="mt-4 flex gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            {getContent()}
        </div>
    );
};
