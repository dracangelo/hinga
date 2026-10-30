import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TONES = {
  success: 'border-sage bg-sage-soft text-forest',
  error: 'border-rose/40 bg-rose-soft text-rose',
  info: 'border-sand bg-white text-ink',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4200);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone] || Info;
          return (
            <div
              key={toast.id}
              className={`animate-rise pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-black/5 backdrop-blur ${TONES[toast.tone]}`}
            >
              <Icon size={17} className="mt-0.5 shrink-0" />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="opacity-50 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
