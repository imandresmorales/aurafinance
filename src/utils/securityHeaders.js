/**
 * Security Headers Configuration & Helper
 * Define cabeceras HTTP de endurecimiento para entornos de producción y proxy/servidor local:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options (nosniff)
 * - X-Frame-Options (DENY)
 * - Referrer-Policy (strict-origin-when-cross-origin)
 * - Permissions-Policy
 */

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

/**
 * Inyecta dinámicamente etiquetas meta equivalentes de seguridad en el DOM del cliente si no están presentes.
 */
export const injectClientSecurityMetaTags = () => {
  if (typeof document === 'undefined') return;

  const metaPolicies = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { name: 'referrer', content: 'strict-origin-when-cross-origin' }
  ];

  metaPolicies.forEach(({ httpEquiv, name, content }) => {
    const selector = httpEquiv
      ? `meta[http-equiv="${httpEquiv}"]`
      : `meta[name="${name}"]`;

    if (!document.querySelector(selector)) {
      const meta = document.createElement('meta');
      if (httpEquiv) meta.httpEquiv = httpEquiv;
      if (name) meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });
};

export default SECURITY_HEADERS;
