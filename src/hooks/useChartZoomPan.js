/**
 * useChartZoomPan.js
 * React Hook for smooth interactive Zoom & Pan across high-density time-series SVG charts.
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook to manage zoom and pan state on an interactive SVG chart.
 * @param {Object} options
 * @param {number} [options.minZoom=1]
 * @param {number} [options.maxZoom=10]
 * @param {number} [options.initialZoom=1]
 * @returns {Object} Zoom & Pan controls and event handlers
 */
export function useChartZoomPan({ minZoom = 1, maxZoom = 10, initialZoom = 1 } = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState(0); // 0 to 1 normalized offset
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  // Zoom In / Out helpers
  const zoomIn = useCallback((factor = 1.25) => {
    setZoom((prev) => Math.min(maxZoom, prev * factor));
  }, [maxZoom]);

  const zoomOut = useCallback((factor = 1.25) => {
    setZoom((prev) => {
      const nextZoom = Math.max(minZoom, prev / factor);
      if (nextZoom === minZoom) {
        setPanOffset(0);
      }
      return nextZoom;
    });
  }, [minZoom]);

  const resetZoomPan = useCallback(() => {
    setZoom(1);
    setPanOffset(0);
  }, []);

  // Wheel zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => {
      const nextZoom = Math.max(minZoom, Math.min(maxZoom, prev * zoomFactor));
      if (nextZoom === minZoom) setPanOffset(0);
      return nextZoom;
    });
  }, [minZoom, maxZoom]);

  // Drag pan handlers
  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = panOffset;
  }, [zoom, panOffset]);

  const handleMouseMove = useCallback((e, containerWidth = 800) => {
    if (!isDraggingRef.current || zoom <= 1) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const normalizedDelta = deltaX / (containerWidth * zoom);
    
    const maxOffset = 1 - 1 / zoom;
    const nextOffset = Math.max(0, Math.min(maxOffset, dragStartOffsetRef.current - normalizedDelta));
    setPanOffset(nextOffset);
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  /**
   * Applies the current zoom and pan window to an input dataset.
   * @param {Array} data - Full dataset
   * @returns {Array} Visible sliced dataset
   */
  const getVisibleDataSlice = useCallback((data = []) => {
    if (!data || data.length === 0 || zoom <= 1) return data;

    const visibleCount = Math.max(2, Math.floor(data.length / zoom));
    const maxStartIndex = data.length - visibleCount;
    const startIndex = Math.max(0, Math.min(maxStartIndex, Math.floor(panOffset * data.length)));
    const endIndex = Math.min(data.length, startIndex + visibleCount);

    return data.slice(startIndex, endIndex);
  }, [zoom, panOffset]);

  return {
    zoom,
    panOffset,
    isZoomed: zoom > 1,
    zoomIn,
    zoomOut,
    resetZoomPan,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getVisibleDataSlice,
  };
}
export default useChartZoomPan;
