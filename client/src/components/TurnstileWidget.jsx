import { useEffect, useRef } from 'react';

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

function TurnstileWidget({ action = 'submit', onError, onExpire, onVerify, resetKey = 0 }) {
  const elementRef = useRef(null);
  const widgetIdRef = useRef(null);

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
          callback: (token) => onVerify?.(token),
          'error-callback': () => onError?.(),
          'expired-callback': () => onExpire?.(),
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'auto',
        });
      })
      .catch(() => {
        if (!isCancelled) {
          onError?.();
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
  }, [action, onError, onExpire, onVerify]);

  useEffect(() => {
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

  return <div ref={elementRef} className="turnstile-widget" />;
}

export function isTurnstileConfigured() {
  return Boolean(TURNSTILE_SITE_KEY);
}

export default TurnstileWidget;
