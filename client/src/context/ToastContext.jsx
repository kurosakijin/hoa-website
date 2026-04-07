import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
const DEFAULT_TOAST_DURATION = 4200;
const MAX_TOASTS = 5;
let toastSequence = 0;

function createToastId() {
  toastSequence += 1;
  return `toast-${toastSequence}`;
}

function normalizeToastInput(input, fallbackTitle) {
  if (typeof input === 'string') {
    return {
      title: fallbackTitle,
      message: input,
    };
  }

  return {
    title: fallbackTitle,
    ...(input || {}),
  };
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.2 16.2 5.5 12.5l-1.4 1.4 5.1 5.1L20 8.2l-1.4-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 1 21h22L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V9h2v4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m18.3 5.71-1.41-1.42L12 9.17 7.11 4.29 5.7 5.71 10.59 10.6 5.7 15.49l1.41 1.42L12 12l4.89 4.91 1.41-1.42-4.89-4.89 4.89-4.89Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getToastIcon(type) {
  switch (type) {
    case 'success':
      return <SuccessIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    default:
      return <InfoIcon />;
  }
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`toast-card toast-card--${toast.type} ${toast.kind === 'confirm' ? 'toast-card--confirm' : ''}`}
          role={toast.kind === 'confirm' ? 'alertdialog' : 'status'}
          aria-labelledby={`${toast.id}-title`}
          aria-describedby={toast.message ? `${toast.id}-message` : undefined}
        >
          <div className="toast-card__icon">{getToastIcon(toast.type)}</div>

          <div className="toast-card__content">
            <div className="toast-card__header">
              <div>
                <p id={`${toast.id}-title`} className="toast-card__title">
                  {toast.title}
                </p>
                {toast.message ? (
                  <p id={`${toast.id}-message`} className="toast-card__message">
                    {toast.message}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="toast-card__close"
                onClick={() => onDismiss(toast.id, toast.kind === 'confirm' ? 'cancel' : 'dismiss')}
                aria-label="Dismiss notification"
              >
                <CloseIcon />
              </button>
            </div>

            {toast.kind === 'confirm' ? (
              <div className="toast-card__actions">
                <button
                  type="button"
                  className="toast-card__action toast-card__action--secondary"
                  onClick={() => onDismiss(toast.id, 'cancel')}
                >
                  {toast.cancelLabel}
                </button>
                <button
                  type="button"
                  className={`toast-card__action toast-card__action--primary toast-card__action--${toast.type}`}
                  onClick={() => onDismiss(toast.id, 'confirm')}
                >
                  {toast.confirmLabel}
                </button>
              </div>
            ) : null}
          </div>

          {toast.kind !== 'confirm' && toast.duration > 0 ? (
            <span
              className="toast-card__progress"
              style={{ animationDuration: `${toast.duration}ms` }}
              aria-hidden="true"
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef([]);
  const timeoutMapRef = useRef(new Map());

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const clearToastTimeout = useCallback((toastId) => {
    const timeoutId = timeoutMapRef.current.get(toastId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(toastId);
    }
  }, []);

  const dismissToast = useCallback(
    (toastId, reason = 'dismiss') => {
      clearToastTimeout(toastId);

      const toast = toastsRef.current.find((item) => item.id === toastId);

      if (!toast) {
        return;
      }

      if (reason === 'confirm') {
        toast.onConfirm?.();
      } else if (reason === 'cancel') {
        toast.onCancel?.();
      } else {
        toast.onDismiss?.();
      }

      setToasts((current) => current.filter((item) => item.id !== toastId));
    },
    [clearToastTimeout]
  );

  useEffect(() => {
    return () => {
      timeoutMapRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutMapRef.current.clear();
    };
  }, []);

  const pushToast = useCallback(
    (config) => {
      const toastId = createToastId();
      const nextToast = {
        duration: DEFAULT_TOAST_DURATION,
        kind: 'notice',
        type: 'info',
        ...config,
        id: toastId,
      };

      setToasts((current) => [nextToast, ...current].slice(0, MAX_TOASTS));

      if (nextToast.kind !== 'confirm' && nextToast.duration > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(toastId);
        }, nextToast.duration);

        timeoutMapRef.current.set(toastId, timeoutId);
      }

      return toastId;
    },
    [dismissToast]
  );

  const success = useCallback(
    (input) => {
      const options = normalizeToastInput(input, 'Nice work');
      return pushToast({
        ...options,
        type: 'success',
      });
    },
    [pushToast]
  );

  const error = useCallback(
    (input) => {
      const options = normalizeToastInput(input, 'Something needs attention');
      return pushToast({
        ...options,
        type: 'error',
        duration: Math.max(options.duration || 0, 5600),
      });
    },
    [pushToast]
  );

  const warning = useCallback(
    (input) => {
      const options = normalizeToastInput(input, 'Heads up');
      return pushToast({
        ...options,
        type: 'warning',
      });
    },
    [pushToast]
  );

  const info = useCallback(
    (input) => {
      const options = normalizeToastInput(input, 'Update');
      return pushToast({
        ...options,
        type: 'info',
      });
    },
    [pushToast]
  );

  const confirm = useCallback(
    (input) =>
      new Promise((resolve) => {
        const options = normalizeToastInput(input, 'Please confirm');

        pushToast({
          ...options,
          kind: 'confirm',
          type: options.type || 'warning',
          duration: 0,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          onDismiss: () => resolve(false),
        });
      }),
    [pushToast]
  );

  const value = useMemo(
    () => ({
      confirm,
      dismiss: dismissToast,
      error,
      info,
      success,
      warning,
    }),
    [confirm, dismissToast, error, info, success, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}
