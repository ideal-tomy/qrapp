import { useCallback, useRef } from 'react';

export function useLongPress(onLongPress: () => void, delayMs = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(() => {
    triggeredRef.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress();
    }, delayMs);
  }, [onLongPress, delayMs, clear]);

  const consumeIfLongPress = useCallback(() => {
    if (triggeredRef.current) {
      triggeredRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    onPointerDown,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    consumeIfLongPress,
  };
}
