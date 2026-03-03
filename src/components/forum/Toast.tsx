import { useEffect, useState } from 'react';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Check size={14} className="text-emerald-700" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-amber-600" />;
      case 'info':
        return <Info size={14} className="text-cyan-600" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10';
      case 'info':
        return 'border-cyan-500/30 bg-cyan-500/10';
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3  border  transition-all duration-300 ${getStyles()} ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      {getIcon()}
      <span className="text-[11px] font-mono text-forum-text flex-1">
        {toast.message}
      </span>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="text-forum-muted hover:text-forum-text transition-forum"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Toast Hook
let toastId = 0;
const toastListeners: Array<(toast: ToastMessage) => void> = [];

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
    };

    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, removeToast };
};

// Global toast function
export const toast = {
  success: (message: string, duration?: number) => {
    const newToast: ToastMessage = {
      id: `toast-${toastId++}`,
      type: 'success',
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(newToast));
  },
  error: (message: string, duration?: number) => {
    const newToast: ToastMessage = {
      id: `toast-${toastId++}`,
      type: 'error',
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(newToast));
  },
  warning: (message: string, duration?: number) => {
    const newToast: ToastMessage = {
      id: `toast-${toastId++}`,
      type: 'warning',
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(newToast));
  },
  info: (message: string, duration?: number) => {
    const newToast: ToastMessage = {
      id: `toast-${toastId++}`,
      type: 'info',
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(newToast));
  },
};
