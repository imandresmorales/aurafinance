/**
 * chartPatterns.js
 * SVG Pattern & Texture Generator for Colorblind-Accessible Data Visualizations (WCAG AAA).
 * Defines high-contrast, scalable SVG patterns (stripes, dots, hatch, waves).
 */

export const ACCESSIBLE_PATTERNS = [
  { id: 'pat-stripes-diag', name: 'Rayas Diagonales', type: 'diagonal-stripes' },
  { id: 'pat-dots', name: 'Puntos Circulares', type: 'dots' },
  { id: 'pat-crosshatch', name: 'Cuadriculado', type: 'crosshatch' },
  { id: 'pat-horizontal', name: 'Líneas Horizontales', type: 'horizontal-lines' },
  { id: 'pat-vertical', name: 'Líneas Verticales', type: 'vertical-lines' },
  { id: 'pat-chevron', name: 'Chevron / Zigzag', type: 'chevron' },
];

/**
 * Returns an array of SVG <pattern> definition objects for embedding into SVG <defs>.
 * @param {string} [strokeColor='rgba(255, 255, 255, 0.4)'] - Color for pattern lines/dots
 * @returns {Array<Object>} List of pattern descriptors with SVG content
 */
export function getSvgPatternDefinitions(strokeColor = 'rgba(255, 255, 255, 0.35)') {
  return [
    {
      id: 'pat-stripes-diag',
      width: 10,
      height: 10,
      patternUnits: 'userSpaceOnUse',
      path: 'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2',
      stroke: strokeColor,
      strokeWidth: 1.5,
    },
    {
      id: 'pat-dots',
      width: 12,
      height: 12,
      patternUnits: 'userSpaceOnUse',
      circle: { cx: 6, cy: 6, r: 2, fill: strokeColor },
    },
    {
      id: 'pat-crosshatch',
      width: 12,
      height: 12,
      patternUnits: 'userSpaceOnUse',
      path: 'M 0,0 L 12,12 M 12,0 L 0,12',
      stroke: strokeColor,
      strokeWidth: 1,
    },
    {
      id: 'pat-horizontal',
      width: 8,
      height: 8,
      patternUnits: 'userSpaceOnUse',
      path: 'M 0,4 L 8,4',
      stroke: strokeColor,
      strokeWidth: 1.5,
    },
    {
      id: 'pat-vertical',
      width: 8,
      height: 8,
      patternUnits: 'userSpaceOnUse',
      path: 'M 4,0 L 4,8',
      stroke: strokeColor,
      strokeWidth: 1.5,
    },
    {
      id: 'pat-chevron',
      width: 16,
      height: 10,
      patternUnits: 'userSpaceOnUse',
      path: 'M 0,5 L 8,0 L 16,5 L 8,10 Z',
      stroke: strokeColor,
      strokeWidth: 1,
    },
  ];
}

/**
 * Returns a pattern ID for a given index.
 * @param {number} index
 * @returns {string} Pattern ID (e.g. 'pat-stripes-diag')
 */
export function getPatternIdByIndex(index) {
  const pattern = ACCESSIBLE_PATTERNS[index % ACCESSIBLE_PATTERNS.length];
  return pattern.id;
}
