import { useEffect } from 'react';

/**
 * useWindowIsolation Hook
 * 1. Protección Anti-Clickjacking: detecta si la app está encapsulada en un <iframe> no autorizado.
 *    Si se detecta framing malicioso, fuerza escape al nivel superior o bloquea la interfaz.
 * 2. Mitigación de Tabnabbing inverso: desvincula window.opener en el arranque.
 * 3. Sanitizador de enlaces externos: añade automáticamente rel="noopener noreferrer" a links externos.
 */
export const useWindowIsolation = () => {
  useEffect(() => {
    // 1. Detección y escape de Framing / Clickjacking
    try {
      if (window.self !== window.top) {
        // La aplicación se encuentra embebida en un frame o iframe
        if (window.top && window.top.location) {
          window.top.location = window.self.location.href;
        } else {
          // Bloqueo defensivo si sandbox previene redirección
          document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#090d16;color:#ef4444;font-family:sans-serif;text-align:center;padding:20px;">
              <div>
                <h2>⚠️ Error de Seguridad (Clickjacking detectado)</h2>
                <p>AuraFinance no puede ejecutarse dentro de marcos o iframes de terceros.</p>
              </div>
            </div>
          `;
        }
      }
    } catch (e) {
      // Bloqueo en caso de violación de Cross-Origin Frame
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#090d16;color:#ef4444;font-family:sans-serif;text-align:center;padding:20px;">
          <div>
            <h2>⚠️ Error de Seguridad (Aislamiento de Ventana)</h2>
            <p>Se ha bloqueado la ejecución no autorizada en un frame.</p>
          </div>
        </div>
      `;
    }

    // 2. Tabnabbing inverso - anular referencia al opener
    if (window.opener) {
      try {
        window.opener = null;
      } catch (e) {
        // Ignorar si opener es de solo lectura en el navegador
      }
    }

    // 3. Sanitización de enlaces salientes no seguros
    const handleDocumentClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.target === '_blank') {
        const rel = target.getAttribute('rel') || '';
        if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
          target.setAttribute('rel', 'noopener noreferrer');
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);
};

export default useWindowIsolation;
