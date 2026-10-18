/**
 * App Badging API Engine
 * Actualiza el contador numérico de facturas o alertas pendientes en el icono
 * de la PWA instalada en sistemas compatibles (Windows, macOS, Android Chrome).
 */

/**
 * Establece el contador numérico en la insignia de la aplicación
 * @param {number} count
 * @returns {Promise<boolean>}
 */
export const setAppBadge = async (count) => {
  if (typeof navigator === 'undefined') return false;

  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
      return true;
    }
  } catch (err) {
    // Si la plataforma no soporta badging o el permiso fue revocado
  }

  return false;
};

/**
 * Limpia la insignia del icono de la aplicación
 * @returns {Promise<boolean>}
 */
export const clearAppBadge = async () => {
  if (typeof navigator === 'undefined') return false;

  try {
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
      return true;
    }
  } catch (err) {
    // Fallback silencioso
  }

  return false;
};

export default { setAppBadge, clearAppBadge };
