// components/ToastNotification.tsx - Toast notification for success/error messages
import React from 'react';

interface ToastNotificationProps {
    message: string;
    type?: 'success' | 'error';
    isVisible: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
                                                                        message,
                                                                        type = 'success',
                                                                        isVisible
                                                                    }) => {
    if (!isVisible || !message) return null;

    const isError = message.includes('Error') || type === 'error';

    return (
        <div className="fixed top-4 right-4 z-40 max-w-md">
            <div className={`rounded-lg shadow-lg p-4 border-l-4 ${
                isError
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-green-50 border-green-400 text-green-800'
            }`}>
                <div className="flex items-center">
                    {isError ? (
                        <div className="w-5 h-5 text-red-600 mr-2">❌</div>
                    ) : (
                        <div className="w-5 h-5 text-green-600 mr-2">✅</div>
                    )}
                    <span className="font-medium">{message}</span>
                </div>
            </div>
        </div>
    );
};