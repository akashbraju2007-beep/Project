import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
      </div>
      {message && (
        <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
