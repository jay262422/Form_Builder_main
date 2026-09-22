const THANK_YOU_STORAGE_KEY = 'form-builder-thank-you';

export function isBuiltInThankYou(url) {
  const path = String(url || '').trim();
  return path === '' || path === '/thank-you' || path === 'thank-you';
}

export function saveThankYouHandoff(payload) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(THANK_YOU_STORAGE_KEY, JSON.stringify(payload));
}

export function readThankYouHandoff() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(THANK_YOU_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
