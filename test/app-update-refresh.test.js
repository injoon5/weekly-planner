import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyAppUpdate } from '../src/lib/app-update-refresh.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('applyAppUpdate', () => {
  it('hard-reloads immediately when there is no waiting worker', () => {
    const reload = vi.fn();
    const updateServiceWorker = vi.fn();

    applyAppUpdate({
      hasWaitingWorker: false,
      updateServiceWorker,
      reload,
    });

    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('skipWaiting then reloads via controllerchange', async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const updateServiceWorker = vi.fn(() => Promise.resolve());
    const listeners = new Map();
    const sw = {
      addEventListener: vi.fn((type, fn) => {
        listeners.set(type, fn);
      }),
      removeEventListener: vi.fn(),
    };

    applyAppUpdate({
      hasWaitingWorker: true,
      updateServiceWorker,
      reload,
      sw,
    });

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(reload).not.toHaveBeenCalled();

    listeners.get('controllerchange')?.();
    expect(reload).toHaveBeenCalledTimes(1);

    // Fallback must not double-reload.
    await vi.advanceTimersByTimeAsync(500);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sw.removeEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
    );
  });

  it('falls back to a hard reload if controlling never fires', async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const updateServiceWorker = vi.fn(() => Promise.resolve());
    const sw = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    applyAppUpdate({
      hasWaitingWorker: true,
      updateServiceWorker,
      reload,
      sw,
      fallbackMs: 350,
    });

    // Flush the updateServiceWorker promise so the fallback timer is armed.
    await vi.runAllTicks();
    expect(reload).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(350);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
