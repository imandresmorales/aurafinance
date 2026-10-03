/**
 * chartExporter.js
 * Native client-side SVG and High-Resolution PNG Graphic Exporter.
 * Adheres strictly to Zero-Knowledge local processing without external servers.
 */

/**
 * Serializes an SVG element into a clean, standalone XML string with proper namespaces.
 * @param {SVGElement} svgElement - The DOM SVG element
 * @returns {string} Standalone SVG XML string
 */
export function serializeSvgToString(svgElement) {
  if (!svgElement) return '';

  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Ensure default background if transparent
  const serializer = new XMLSerializer();
  return '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(clone);
}

/**
 * Triggers a client-side download of an SVG element as a .svg vector file.
 * @param {SVGElement} svgElement - DOM SVG node
 * @param {string} [filename='aurafinance_grafico.svg']
 */
export function exportSvgToFile(svgElement, filename = 'aurafinance_grafico.svg') {
  const svgString = serializeSvgToString(svgElement);
  if (!svgString) return;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Rasterizes an SVG element to a high-resolution PNG image on an offscreen canvas and triggers download.
 * @param {SVGElement} svgElement - DOM SVG node
 * @param {string} [filename='aurafinance_grafico.png']
 * @param {number} [scale=2] - Resolution scaling (2 = 2x Retina, 3 = 3x Ultra-HD)
 * @returns {Promise<void>}
 */
export function exportSvgToPng(svgElement, filename = 'aurafinance_grafico.png', scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      const svgString = serializeSvgToString(svgElement);
      if (!svgString) {
        resolve();
        return;
      }

      const bbox = svgElement.getBoundingClientRect();
      const width = (bbox.width || 800) * scale;
      const height = (bbox.height || 400) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Draw dark surface background for glassmorphism preservation
        ctx.fillStyle = '#041a14';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve();
            return;
          }
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, 'image/png');
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}
