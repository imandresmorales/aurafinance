/**
 * svgChartEngine.js
 * Native Zero-Dependency SVG Vector Geometry & Mathematical Charting Engine.
 * Provides hyper-fluid Bezier spline curves, linear/time scales, donut arcs,
 * bar layouts, and accessible grid coordinate systems.
 */

/**
 * Creates a linear scale function mapping domain [min, max] to range [min, max].
 * @param {Array<number>} domain - [dataMin, dataMax]
 * @param {Array<number>} range - [pixelMin, pixelMax]
 * @param {boolean} [clamp=false] - Whether to clamp values to range
 * @returns {Function} Scale mapping function
 */
export function createLinearScale([d0, d1], [r0, r1], clamp = false) {
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;

  return (val) => {
    if (domainSpan === 0) return (r0 + r1) / 2;
    let normalized = (val - d0) / domainSpan;
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized));
    }
    return r0 + normalized * rangeSpan;
  };
}

/**
 * Computes optimal nice tick values for a numerical range.
 * @param {number} min - Data minimum
 * @param {number} max - Data maximum
 * @param {number} [targetCount=5] - Desired number of ticks
 * @returns {Array<number>} List of nice rounded tick values
 */
export function calculateNiceTicks(min, max, targetCount = 5) {
  if (min === max) return [min];
  if (min > max) [min, max] = [max, min];

  const span = max - min;
  const stepRaw = span / targetCount;
  const power = Math.floor(Math.log10(stepRaw));
  const fraction = stepRaw / Math.pow(10, power);

  let niceFraction;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  const step = niceFraction * Math.pow(10, power);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks = [];
  for (let t = niceMin; t <= niceMax + step * 0.5; t += step) {
    ticks.push(Math.round(t * 1000000) / 1000000);
  }
  return ticks;
}

/**
 * Generates an SVG path string for a smooth cubic Bezier spline passing through points.
 * Uses Catmull-Rom to Cubic Bezier conversion.
 * @param {Array<{x: number, y: number}>} points - Array of coordinate points
 * @param {number} [tension=0.2] - Smoothing tension between 0 and 1
 * @returns {string} SVG Path 'd' attribute string
 */
export function generateSmoothPath(points = [], tension = 0.2) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)},${points[1].y.toFixed(2)}`;
  }

  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + ((p2.x - p0.x) * tension);
    const cp1y = p1.y + ((p2.y - p0.y) * tension);
    const cp2x = p2.x - ((p3.x - p1.x) * tension);
    const cp2y = p2.y - ((p3.y - p1.y) * tension);

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

/**
 * Generates a closed area SVG path between a smooth curve and a baseline y-coordinate.
 * @param {Array<{x: number, y: number}>} points - Points array
 * @param {number} baselineY - Y coordinate of the baseline (e.g., bottom of chart)
 * @param {number} [tension=0.2] - Smoothing tension
 * @returns {string} SVG closed area path
 */
export function generateSmoothAreaPath(points = [], baselineY = 0, tension = 0.2) {
  if (!points || points.length < 2) return '';
  const curve = generateSmoothPath(points, tension);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return `${curve} L ${lastPoint.x.toFixed(2)},${baselineY.toFixed(2)} L ${firstPoint.x.toFixed(2)},${baselineY.toFixed(2)} Z`;
}

/**
 * Calculates geometry for Donut / Pie chart sectors.
 * @param {Array<{label: string, value: number, color?: string}>} data - Slices data
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} innerRadius - Donut hole radius
 * @param {number} outerRadius - Outer pie radius
 * @param {number} [padAngle=0.02] - Padding angle between sectors in radians
 * @returns {Array<Object>} Calculated sectors with SVG paths and centroid labels
 */
export function calculateDonutSlices(data = [], cx = 150, cy = 150, innerRadius = 70, outerRadius = 120, padAngle = 0.02) {
  const total = data.reduce((sum, d) => sum + (Math.max(0, Number(d.value)) || 0), 0);
  if (total === 0) return [];

  let currentAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const results = [];

  data.forEach((item, index) => {
    const val = Math.max(0, Number(item.value)) || 0;
    if (val === 0) return;

    const proportion = val / total;
    const sweep = proportion * 2 * Math.PI;
    const startAngle = currentAngle + (padAngle / 2);
    const endAngle = currentAngle + sweep - (padAngle / 2);
    currentAngle += sweep;

    // Outer arc points
    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    // Inner arc points
    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sweep > Math.PI ? 1 : 0;

    // SVG path definition for donut segment
    const path = [
      `M ${x1.toFixed(2)},${y1.toFixed(2)}`,
      `A ${outerRadius},${outerRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)},${y3.toFixed(2)}`,
      `A ${innerRadius},${innerRadius} 0 ${largeArcFlag} 0 ${x4.toFixed(2)},${y4.toFixed(2)}`,
      'Z',
    ].join(' ');

    // Mid angle & Centroid for label / tooltip position
    const midAngle = (startAngle + endAngle) / 2;
    const centroidRadius = (innerRadius + outerRadius) / 2;
    const centroidX = cx + centroidRadius * Math.cos(midAngle);
    const centroidY = cy + centroidRadius * Math.sin(midAngle);

    results.push({
      ...item,
      index,
      value: val,
      percentage: Math.round(proportion * 1000) / 10,
      path,
      startAngle,
      endAngle,
      midAngle,
      centroid: { x: centroidX, y: centroidY },
    });
  });

  return results;
}

/**
 * Calculates coordinates and dimensions for grouped bars.
 * @param {Array<{group: string, values: Array<{key: string, value: number, color: string}>}>} data
 * @param {number} width - Usable plot width
 * @param {number} height - Usable plot height
 * @param {number} [groupPadding=0.2] - Padding between groups (0..1)
 * @param {number} [barPadding=0.1] - Padding between bars within a group (0..1)
 * @returns {Object} Layout with computed bars and axes
 */
export function calculateGroupedBars(data = [], width = 500, height = 300, groupPadding = 0.2, barPadding = 0.1) {
  if (!data || data.length === 0) return { groups: [], maxY: 100 };

  // Find maximum value across all bars
  let maxY = 0;
  data.forEach((g) => {
    (g.values || []).forEach((v) => {
      const num = Number(v.value) || 0;
      if (num > maxY) maxY = num;
    });
  });

  if (maxY === 0) maxY = 100;
  maxY = maxY * 1.1; // Add 10% headroom

  const groupCount = data.length;
  const groupBandWidth = width / groupCount;
  const groupInnerWidth = groupBandWidth * (1 - groupPadding);
  const groupMargin = (groupBandWidth - groupInnerWidth) / 2;

  const yScale = createLinearScale([0, maxY], [height, 0]);

  const groups = data.map((g, gIdx) => {
    const barsInGroup = (g.values || []).length;
    const barBandWidth = barsInGroup > 0 ? groupInnerWidth / barsInGroup : 0;
    const barWidth = barBandWidth * (1 - barPadding);
    const barMargin = (barBandWidth - barWidth) / 2;

    const groupStartX = gIdx * groupBandWidth + groupMargin;

    const bars = (g.values || []).map((b, bIdx) => {
      const val = Number(b.value) || 0;
      const x = groupStartX + bIdx * barBandWidth + barMargin;
      const y = yScale(val);
      const barHeight = height - y;

      return {
        ...b,
        value: val,
        x,
        y,
        width: barWidth,
        height: Math.max(0, barHeight),
      };
    });

    return {
      group: g.group,
      x: groupStartX + groupInnerWidth / 2,
      bars,
    };
  });

  return {
    groups,
    maxY,
    yScale,
  };
}
