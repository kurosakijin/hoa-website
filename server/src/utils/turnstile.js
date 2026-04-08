const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

async function verifyTurnstileToken(token, remoteIp) {
  if (!isTurnstileEnabled()) {
    return;
  }

  if (!token) {
    const error = new Error('Cloudflare verification is required.');
    error.statusCode = 400;
    throw error;
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const error = new Error('Cloudflare verification could not be completed.');
    error.statusCode = 502;
    throw error;
  }

  const result = await response.json();

  if (!result.success) {
    const error = new Error('Cloudflare verification failed. Please try again.');
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  isTurnstileEnabled,
  verifyTurnstileToken,
};
