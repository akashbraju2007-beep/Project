import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-center w-full min-h-[200px] p-4">
      <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-6 max-w-md w-full text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-red-400 font-semibold text-lg mb-2">Something went wrong</h3>
        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
          {message || 'An unexpected error occurred. Please try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
