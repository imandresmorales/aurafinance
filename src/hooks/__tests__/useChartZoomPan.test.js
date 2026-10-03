import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChartZoomPan } from '../useChartZoomPan';

describe('useChartZoomPan Hook - Interactive Chart Navigation', () => {
  it('initializes with default zoom level of 1 and zero offset', () => {
    const { result } = renderHook(() => useChartZoomPan());

    expect(result.current.zoom).toBe(1);
    expect(result.current.panOffset).toBe(0);
    expect(result.current.isZoomed).toBe(false);
  });

  it('zooms in and limits to maxZoom', () => {
    const { result } = renderHook(() => useChartZoomPan({ minZoom: 1, maxZoom: 4 }));

    act(() => {
      result.current.zoomIn(2);
    });

    expect(result.current.zoom).toBe(2);
    expect(result.current.isZoomed).toBe(true);

    act(() => {
      result.current.zoomIn(3);
    });

    expect(result.current.zoom).toBe(4); // Clamped at maxZoom
  });

  it('slices data correctly based on zoom factor', () => {
    const { result } = renderHook(() => useChartZoomPan());
    const dataset = Array.from({ length: 100 }, (_, i) => ({ id: i, value: i * 10 }));

    // When zoom is 1, returns full dataset
    expect(result.current.getVisibleDataSlice(dataset)).toHaveLength(100);

    // Zoom in 2x -> slice should have ~50 items
    act(() => {
      result.current.zoomIn(2);
    });

    const slice = result.current.getVisibleDataSlice(dataset);
    expect(slice.length).toBeLessThan(100);
    expect(slice.length).toBeGreaterThanOrEqual(48);
  });

  it('resets zoom and pan seamlessly', () => {
    const { result } = renderHook(() => useChartZoomPan());

    act(() => {
      result.current.zoomIn(3);
    });
    expect(result.current.zoom).toBe(3);

    act(() => {
      result.current.resetZoomPan();
    });
    expect(result.current.zoom).toBe(1);
    expect(result.current.panOffset).toBe(0);
    expect(result.current.isZoomed).toBe(false);
  });
});
