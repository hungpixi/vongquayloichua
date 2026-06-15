/**
 * Get the dynamic production URL for QR codes and sharing links.
 * In production (not localhost), this always uses the current browser origin (window.location.origin),
 * which ensures the domain is completely dynamic and works if the site is moved to another domain or custom domain.
 * In local development, it falls back to VITE_PRODUCTION_URL (if configured) so that QR codes scanned by mobile
 * devices point to the live staging/production deployment for testing, or falls back to window.location.origin.
 */
export const getProductionUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  let url = window.location.origin;

  if (isLocal && import.meta.env.VITE_PRODUCTION_URL) {
    url = import.meta.env.VITE_PRODUCTION_URL.trim();
  }

  // Ensure it has a protocol
  if (!/^https?:\/\//i.test(url)) {
    const isUrlLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');
    url = (isUrlLocal ? 'http://' : 'https://') + url;
  }

  // Remove trailing slashes
  return url.replace(/\/+$/, '');
};

/**
 * Robustly copies text to the clipboard across different browsers and contexts (secure/insecure).
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy using navigator.clipboard:', err);
    }
  }

  // Fallback for older browsers or non-secure contexts (e.g. HTTP, mobile webviews like Zalo/Facebook)
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    document.body.removeChild(textArea);
    return false;
  }
};
