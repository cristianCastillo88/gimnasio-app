import { useState, useEffect, useRef, useCallback } from "react";
import { soundService } from "../services/soundService";
import { hapticsService } from "../services/hapticsService";

export interface UseRestTimerReturn {
  secondsRemaining: number;
  totalSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  progress: number; // 0 a 1 (para barras o círculos de progreso)
  startTimer: (seconds: number) => void;
  addSeconds: (delta: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
}

export const useRestTimer = (): UseRestTimerReturn => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const pausedTimeRemainingRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const cancelScheduledBellRef = useRef<(() => void) | null>(null);

  // Limpieza del intervalo
  const clearIntervalRef = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const cancelScheduledBell = useCallback(() => {
    if (cancelScheduledBellRef.current) {
      cancelScheduledBellRef.current();
      cancelScheduledBellRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    clearIntervalRef();
    cancelScheduledBell();
    targetEndTimeRef.current = null;
    pausedTimeRemainingRef.current = 0;
    setSecondsRemaining(0);
    setTotalSeconds(0);
    setIsActive(false);
    setIsPaused(false);
  }, [clearIntervalRef, cancelScheduledBell]);

  const onTimerComplete = useCallback(() => {
    clearIntervalRef();
    // No cancelamos el oscilador aquí porque ya está sonando o acaba de sonar puntualmente
    cancelScheduledBellRef.current = null;
    targetEndTimeRef.current = null;
    pausedTimeRemainingRef.current = 0;
    setSecondsRemaining(0);
    setTotalSeconds(0);
    setIsActive(false);
    setIsPaused(false);
    hapticsService.vibrateTimerEnd();
  }, [clearIntervalRef]);

  const startTimer = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;

      clearIntervalRef();
      cancelScheduledBell();
      const now = Date.now();
      targetEndTimeRef.current = now + seconds * 1000;
      pausedTimeRemainingRef.current = 0;

      setTotalSeconds(seconds);
      setSecondsRemaining(seconds);
      setIsActive(true);
      setIsPaused(false);

      hapticsService.vibrateLight();
      // Programamos en el reloj de hardware para pantalla apagada / throttling
      cancelScheduledBellRef.current = soundService.scheduleRestEndBell(seconds);

      timerIntervalRef.current = window.setInterval(() => {
        if (!targetEndTimeRef.current) return;

        const remainingMs = targetEndTimeRef.current - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

        if (remainingSec <= 0) {
          onTimerComplete();
        } else {
          setSecondsRemaining(remainingSec);
        }
      }, 500);
    },
    [clearIntervalRef, cancelScheduledBell, onTimerComplete]
  );

  const pauseTimer = useCallback(() => {
    if (!isActive || isPaused || !targetEndTimeRef.current) return;

    clearIntervalRef();
    cancelScheduledBell();
    const remainingMs = targetEndTimeRef.current - Date.now();
    pausedTimeRemainingRef.current = Math.max(0, Math.ceil(remainingMs / 1000));

    setIsPaused(true);
    setSecondsRemaining(pausedTimeRemainingRef.current);
  }, [isActive, isPaused, clearIntervalRef, cancelScheduledBell]);

  const resumeTimer = useCallback(() => {
    if (!isActive || !isPaused || pausedTimeRemainingRef.current <= 0) return;

    const seconds = pausedTimeRemainingRef.current;
    const now = Date.now();
    targetEndTimeRef.current = now + seconds * 1000;

    setIsPaused(false);
    cancelScheduledBellRef.current = soundService.scheduleRestEndBell(seconds);

    timerIntervalRef.current = window.setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSec <= 0) {
        onTimerComplete();
      } else {
        setSecondsRemaining(remainingSec);
      }
    }, 500);
  }, [isActive, isPaused, onTimerComplete]);

  const addSeconds = useCallback(
    (delta: number) => {
      if (!isActive) return;

      cancelScheduledBell();

      if (isPaused) {
        const next = Math.max(0, pausedTimeRemainingRef.current + delta);
        if (next <= 0) {
          onTimerComplete();
        } else {
          pausedTimeRemainingRef.current = next;
          setSecondsRemaining(next);
          setTotalSeconds((prev) => Math.max(next, prev + delta));
        }
      } else if (targetEndTimeRef.current) {
        targetEndTimeRef.current += delta * 1000;
        const remainingMs = targetEndTimeRef.current - Date.now();
        const next = Math.max(0, Math.ceil(remainingMs / 1000));

        if (next <= 0) {
          onTimerComplete();
        } else {
          setSecondsRemaining(next);
          setTotalSeconds((prev) => Math.max(next, prev + delta));
          cancelScheduledBellRef.current = soundService.scheduleRestEndBell(next);
        }
      }
      hapticsService.vibrateLight();
    },
    [isActive, isPaused, cancelScheduledBell, onTimerComplete]
  );

  // Limpieza al desmontar el componente (según vercel-react-best-practices)
  useEffect(() => {
    return () => {
      clearIntervalRef();
      cancelScheduledBell();
    };
  }, [clearIntervalRef, cancelScheduledBell]);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;

  return {
    secondsRemaining,
    totalSeconds,
    isActive,
    isPaused,
    progress,
    startTimer,
    addSeconds,
    pauseTimer,
    resumeTimer,
    stopTimer,
  };
};
