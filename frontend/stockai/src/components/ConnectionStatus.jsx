import React from 'react';

const ConnectionStatus = ({ isConnected }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
        isConnected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        ></span>
      </span>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};

export default ConnectionStatus;
