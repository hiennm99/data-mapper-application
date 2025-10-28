// components/ParsingOverlay.tsx - Loading and export status overlay
import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
}

export const ParsingOverlay: React.FC<LoadingOverlayProps> = ({
                                                                 isVisible,
                                                                 message = "Please wait while we parse your files..."
                                                             }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-6 max-w-sm mx-4">
                {/* Animated spinner */}
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>

                {/* Content */}
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Parsing Your Files</h3>
                    <p className="text-gray-600">{message}</p>
                </div>

                {/* Progress dots animation */}
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        </div>
    );
};