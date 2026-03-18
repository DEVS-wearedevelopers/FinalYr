import React from 'react';

interface ErrorBannerProps {
    message: string;
    onDismiss?: () => void;
}

/**
 * Clean, simple error banner — details are logged server-side.
 * Shows a single human-readable sentence, never raw stack traces or Zod bullets.
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm">
            <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="flex-1 font-medium text-red-700 leading-snug">{message}</p>
            {onDismiss && (
                <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
