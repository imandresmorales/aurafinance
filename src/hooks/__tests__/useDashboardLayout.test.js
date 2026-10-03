import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardLayout, DEFAULT_ANALYTICS_WIDGETS } from '../useDashboardLayout';

describe('useDashboardLayout Hook - Modular Dashboard Customization', () => {
  it('initializes with all default analytics widgets visible', () => {
    const { result } = renderHook(() => useDashboardLayout());

    expect(result.current.widgets).toHaveLength(DEFAULT_ANALYTICS_WIDGETS.length);
    expect(result.current.widgets.every((w) => w.visible)).toBe(true);
  });

  it('toggles widget visibility on and off', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.toggleWidgetVisibility('micro-trends');
    });

    const target = result.current.widgets.find((w) => w.id === 'micro-trends');
    expect(target.visible).toBe(false);

    act(() => {
      result.current.toggleWidgetVisibility('micro-trends');
    });

    const restored = result.current.widgets.find((w) => w.id === 'micro-trends');
    expect(restored.visible).toBe(true);
  });

  it('reorders widgets up and down', () => {
    const { result } = renderHook(() => useDashboardLayout());

    const firstId = result.current.widgets[0].id;
    const secondId = result.current.widgets[1].id;

    act(() => {
      result.current.moveWidget(0, 1); // move down
    });

    expect(result.current.widgets[0].id).toBe(secondId);
    expect(result.current.widgets[1].id).toBe(firstId);
  });

  it('resets layout to default state', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.toggleWidgetVisibility('micro-trends');
      result.current.moveWidget(0, 1);
      result.current.resetLayout();
    });

    expect(result.current.widgets[0].id).toBe(DEFAULT_ANALYTICS_WIDGETS[0].id);
    expect(result.current.widgets[0].visible).toBe(true);
  });
});
