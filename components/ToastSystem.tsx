import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage, ToastType } from '../types';

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  // Auto dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return {
        bg: 'bg-green-500/10', border: 'border-green-500', 
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        text: 'text-green-100', title: 'text-green-400'
      };
      case 'error': return {
        bg: 'bg-red-500/10', border: 'border-red-500', 
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        text: 'text-red-100', title: 'text-red-400'
      };
      case 'warning': return {
        bg: 'bg-orange-500/10', border: 'border-orange-500', 
        icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
        text: 'text-orange-100', title: 'text-orange-400'
      };
      default: return {
        bg: 'bg-blue-500/10', border: 'border-blue-500', 
        icon: <Info className="w-5 h-5 text-blue-400" />,
        text: 'text-blue-100', title: 'text-blue-400'
      };
    }
  };

  const style = getStyles(toast.type);

  return (
    <div className={`
      relative overflow-hidden w-full max-w-sm rounded-xl border ${style.border} ${style.bg} 
      backdrop-blur-xl shadow-lg p-4 mb-3 animate-slide-in flex gap-3 z-[9999] transition-all
    `}>
       {/* Glow Effect */}
       <div className={`absolute top-0 left-0 w-1 h-full ${style.border.replace('border-', 'bg-')} opacity-50`} />
       
       <div className="shrink-0 pt-0.5">
         {style.icon}
       </div>
       <div className="flex-1 min-w-0">
          {toast.title && <h4 className={`text-sm font-bold mb-0.5 ${style.title}`}>{toast.title}</h4>}
          <p className={`text-sm ${style.text}`}>{toast.message}</p>
       </div>
       <button 
          onClick={() => onDismiss(toast.id)}
          className={`shrink-0 self-start -mr-1 -mt-1 p-1 rounded-lg hover:bg-white/10 ${style.text}`}
       >
         <X className="w-4 h-4" />
       </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title, duration: 4000 }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, title?: string) => addToast('success', msg, title),
    error: (msg: string, title?: string) => addToast('error', msg, title),
    warning: (msg: string, title?: string) => addToast('warning', msg, title),
    info: (msg: string, title?: string) => addToast('info', msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container Positioned Fixed */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end w-full max-w-sm pointer-events-none">
        <div className="pointer-events-auto w-full">
            {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// Add styles to head for animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;
document.head.appendChild(style);