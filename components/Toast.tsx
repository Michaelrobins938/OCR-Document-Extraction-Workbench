import React, { useEffect } from 'react';
import { CheckIcon, WarningIcon, ErrorIcon, XIcon } from './icons.tsx';

interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckIcon className="h-6 w-6 text-success" />,
    bgClass: 'bg-success/20 border-success',
  },
  warning: {
    icon: <WarningIcon className="h-6 w-6 text-warning" />,
    bgClass: 'bg-warning/20 border-warning',
  },
  danger: {
    icon: <ErrorIcon className="h-6 w-6 text-danger" />,
    bgClass: 'bg-danger/20 border-danger',
  },
  info: {
    icon: <WarningIcon className="h-6 w-6 text-blue-400" />, // Using WarningIcon as a generic info icon, consider a specific one if available
    bgClass: 'bg-blue-400/20 border-blue-400',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const config = toastConfig[type];

  return (
    <>
      <div
        className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg border-l-4 transition-transform animate-slide-in ${config.bgClass}`}
        role="alert"
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className={`ml-3 text-sm font-medium text-text-light`}>{message}</div>
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg p-1.5 inline-flex h-8 w-8 text-text-dark hover:text-text-light focus:ring-2 focus:ring-gray-300"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Toast;