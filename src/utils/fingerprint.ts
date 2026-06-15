export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server';
  
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
  const debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
  const renderer = (gl && debugInfo) ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  const payload = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    `${screen.width}x${screen.height}`,
    renderer
  ].join('|');

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
