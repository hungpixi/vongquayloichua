/**
 * Verifies an HMAC-SHA256 hex signature using the Web Crypto API.
 * 
 * @param message The raw message string that was signed
 * @param signature The hex signature string to verify
 * @param secret The shared HMAC secret key
 * @returns Promise<boolean> true if signature is valid, false otherwise
 */
export async function verifyHmacSignature(
  message: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    // Import the secret key for HMAC SHA-256 operations
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert hex signature string back to byte array (Uint8Array)
    const cleanSig = signature.trim().toLowerCase();
    const sigBytes = new Uint8Array(
      cleanSig.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    if (sigBytes.length !== 32) {
      console.warn('HMAC verification warning: signature size is not 32 bytes.');
      return false;
    }

    // Verify signature using Web Crypto API
    return await window.crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      messageData
    );
  } catch (err) {
    console.error('HMAC verification error:', err);
    return false;
  }
}
