import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise = null;

function loadTurnstileScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

function TurnstileWidget({
  action = 'submit',
  className = '',
  hideOnSuccess = true,
  onError,
  onExpire,
  onVerify,
  resetKey = 0,
  size = 'normal',
}) {
  const elementRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let isCancelled = false;

    if (!TURNSTILE_SITE_KEY || !elementRef.current) {
      return undefined;
    }

    loadTurnstileScript()
      .then((turnstile) => {
        if (isCancelled || !turnstile || !elementRef.current || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = turnstile.render(elementRef.current, {
          action,
          callback: (token) => {
            setIsVerified(true);
            onVerifyRef.current?.(token);
          },
          'error-callback': () => {
            setIsVerified(false);
            onErrorRef.current?.();
          },
          'expired-callback': () => {
            setIsVerified(false);
            onExpireRef.current?.();
          },
          sitekey: TURNSTILE_SITE_KEY,
          size,
          theme: 'auto',
        });
      })
      .catch(() => {
        if (!isCancelled) {
          onErrorRef.current?.();
        }
      });

    return () => {
      isCancelled = true;

      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_error) {
          // Ignore widget cleanup issues during route changes.
        }
      }

      widgetIdRef.current = null;
    };
  }, [action, size]);

  useEffect(() => {
    setIsVerified(false);

    if (window.turnstile && widgetIdRef.current !== null) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (_error) {
        // Ignore reset issues and let the next interaction recover naturally.
      }
    }
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div
      ref={elementRef}
      aria-hidden={hideOnSuccess && isVerified ? true : undefined}
      className={`turnstile-widget ${hideOnSuccess && isVerified ? 'turnstile-widget--verified' : ''} ${className}`.trim()}
    />
  );
}

export function isTurnstileConfigured() {
  return Boolean(TURNSTILE_SITE_KEY);
}

export default TurnstileWidget;
