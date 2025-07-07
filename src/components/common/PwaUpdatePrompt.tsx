import React from "react";

interface PwaUpdatePromptProps {
  open: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

const PwaUpdatePrompt: React.FC<PwaUpdatePromptProps> = ({ open, onUpdate, onClose }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`fixed left-0 right-0 bottom-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ${open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="pointer-events-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl px-6 py-4 mb-6 flex items-center gap-4 max-w-md w-full animate-slideInUp"
      >
        <span className="text-blue-600 dark:text-blue-400 font-semibold flex-1">
          🚀 A new version is available!
        </span>
        <button
          onClick={onUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Update
        </button>
        <button
          onClick={onClose}
          aria-label="Dismiss update prompt"
          className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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