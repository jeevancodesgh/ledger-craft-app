import React, { useState } from "react";

interface PwaUpdatePromptProps {
  open: boolean;
  onUpdate: () => void;
  onForceUpdate: () => void;
  onClearCaches: () => void;
  onClose: () => void;
}

const PwaUpdatePrompt: React.FC<PwaUpdatePromptProps> = ({ 
  open, 
  onUpdate, 
  onForceUpdate, 
  onClearCaches, 
  onClose 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`fixed left-0 right-0 bottom-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ${open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="pointer-events-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl px-6 py-4 mb-6 max-w-md w-full animate-slideInUp"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              🚀
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              New Version Available!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We've made improvements to EasyBizInvoice. Update now to get the latest features and fixes.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={onUpdate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Update Now
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            title="Advanced options"
          >
            ⚙️
          </button>
          <button
            onClick={onClose}
            aria-label="Dismiss update prompt"
            className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            ✕
          </button>
        </div>

        {showAdvanced && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Developer Options:
            </p>
            <div className="flex gap-2">
              <button
                onClick={onForceUpdate}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                title="Force refresh with complete cache clear"
              >
                🔥 Force Refresh
              </button>
              <button
                onClick={onClearCaches}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                title="Clear all caches"
              >
                🧹 Clear Cache
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideInUp {
          animation: slideInUp 0.5s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default PwaUpdatePrompt; 