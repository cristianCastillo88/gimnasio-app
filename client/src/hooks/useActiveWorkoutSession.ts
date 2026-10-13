import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  ActiveRoutineResponse,
  RoutineDayDetail,
  WorkoutSessionPayload,
  WorkoutSetLogPayload,
  PreviousExercisePerformance,
} from "../api/types";
import { studentApi } from "../api/apiClient";
import { gymDb } from "../db/gymDatabase";
import { soundService } from "../services/soundService";
import { hapticsService } from "../services/hapticsService";
import { useOfflineSync } from "./useOfflineSync";

export interface ActiveSetState {
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  actualReps: number;
  actualWeight: number;
  completed: boolean;
}

export interface ActiveExerciseState {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  videoUrl?: string;
  executionTips?: string;
  restSeconds: number;
  sets: ActiveSetState[];
  previousPerformance?: PreviousExercisePerformance;
}

export interface UseActiveWorkoutSessionReturn {
  routine: ActiveRoutineResponse | null;
  selectedDay: RoutineDayDetail | null;
  exercises: ActiveExerciseState[];
  isSessionActive: boolean;
  isLoading: boolean;
  error: string | null;
  startedAt: string | null;
  completedSetsCount: number;
  totalSetsCount: number;
  sessionProgress: number; // 0 a 100
  totalVolumeKg: number;
  selectDay: (dayId: string) => void;
  startSession: (dayId: string) => void;
  updateSet: (exerciseId: string, setIndex: number, actuals: { reps?: number; weight?: number }) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => number | null; // Retorna restSeconds si se completó
  finishSession: (rpe: number, notes?: string) => Promise<WorkoutSessionPayload | null>;
  cancelSession: () => void;
  refreshRoutine: () => Promise<void>;
}

export const useActiveWorkoutSession = (): UseActiveWorkoutSessionReturn => {
  const [routine, setRoutine] = useState<ActiveRoutineResponse | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ActiveExerciseState[]>([]);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { syncPendingSessions } = useOfflineSync();

  // Carga Stale-While-Revalidate de la rutina asignada
  const loadRoutine = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 1. Lectura inmediata de caché local (Dexie.js)
    try {
      const cached = await gymDb.getCachedActiveRoutine();
      if (cached) {
        setRoutine(cached);
        if (!selectedDayId && cached.days.length > 0) {
          setSelectedDayId(cached.days[0].id);
        }
      }
    } catch {
      // Ignorar error de lectura local
    }

    // 2. Revalidación en segundo plano contra la API si hay red
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const fresh = await studentApi.getActiveRoutine();
        setRoutine(fresh);
        await gymDb.saveActiveRoutine(fresh);
        if (!selectedDayId && fresh.days.length > 0) {
          setSelectedDayId(fresh.days[0].id);
        }
      } catch (err: unknown) {
        // Si no había caché, exponemos el error
        if (!routine) {
          const message = err instanceof Error ? err.message : "Error al cargar rutina";
          setError(message);
        }
      }
    }

    setIsLoading(false);
  }, [selectedDayId, routine]);

  useEffect(() => {
    void loadRoutine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDay = useMemo(() => {
    if (!routine || !selectedDayId) return null;
    return routine.days.find((d) => d.id === selectedDayId) || null;
  }, [routine, selectedDayId]);

  const selectDay = useCallback((dayId: string) => {
    setSelectedDayId(dayId);
  }, []);

  // Iniciar entrenamiento del día seleccionado
  const startSession = useCallback(
    (dayId: string) => {
      if (!routine) return;
      const day = routine.days.find((d) => d.id === dayId);
      if (!day) return;

      setSelectedDayId(dayId);
      const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `workout-${Date.now()}`;
      setIdempotencyKey(uuid);
      setStartedAt(new Date().toISOString());

      // Mapear ejercicios del día a estado mutable
      const initialExercises: ActiveExerciseState[] = day.exercises.map((ex) => {
        const parsedReps = parseInt(ex.targetReps, 10) || 10;

        const sets: ActiveSetState[] = Array.from({ length: ex.targetSets }, (_, index) => {

          // Autocompletado inteligente con base en la última sesión real del alumno
          const prevSetForNumber = ex.previousSession?.sets?.find((s) => s.setNumber === index + 1);
          const fallbackPrevSet = ex.previousSession?.sets?.[0];
          const historicalSet = prevSetForNumber || fallbackPrevSet;

          const smartWeight = historicalSet?.weightKg !== undefined ? historicalSet.weightKg : (ex.suggestedWeightKg || 0);
          const smartReps = historicalSet?.reps !== undefined ? historicalSet.reps : parsedReps;

          return {
            setNumber: index + 1,
            targetReps: ex.targetReps,
            targetWeight: ex.suggestedWeightKg || smartWeight,
            actualReps: smartReps,
            actualWeight: smartWeight,
            completed: false,
          };
        });


        return {
          routineExerciseId: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          videoUrl: ex.videoUrl,
          executionTips: ex.executionTips,
          restSeconds: ex.suggestedRestSeconds,
          sets,
          previousPerformance: ex.previousSession,
        };
      });

      setExercises(initialExercises);
      setIsSessionActive(true);
      hapticsService.vibrateLight();
    },
    [routine]
  );

  // Actualizar peso o repeticiones de una serie
  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, actuals: { reps?: number; weight?: number }) => {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;

          const updatedSets = ex.sets.map((s, idx) => {
            if (idx !== setIndex) return s;
            return {
              ...s,
              actualReps: actuals.reps !== undefined ? Math.max(0, actuals.reps) : s.actualReps,
              actualWeight: actuals.weight !== undefined ? Math.max(0, actuals.weight) : s.actualWeight,
            };
          });

          return { ...ex, sets: updatedSets };
        })
      );
    },
    []
  );

  // Alternar estado completado de una serie con feedback háptico y sonoro
  const toggleSetCompleted = useCallback(
    (exerciseId: string, setIndex: number): number | null => {
      let restSecondsToTrigger: number | null = null;

      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;

          const updatedSets = ex.sets.map((s, idx) => {
            if (idx !== setIndex) return s;
            const nextCompleted = !s.completed;

            if (nextCompleted) {
              soundService.playSetCompletedTone();
              hapticsService.vibrateSetComplete();
              restSecondsToTrigger = ex.restSeconds;
            } else {
              hapticsService.vibrateLight();
            }

            return { ...s, completed: nextCompleted };
          });

          return { ...ex, sets: updatedSets };
        })
      );

      return restSecondsToTrigger;
    },
    []
  );

  // Finalizar sesión, encolar en Dexie y sincronizar
  const finishSession = useCallback(
    async (rpe: number, notes?: string): Promise<WorkoutSessionPayload | null> => {
      if (!isSessionActive || !idempotencyKey || !selectedDay || !startedAt) {
        return null;
      }

      // Ensamblar los logs de series con los nombres del contrato OpenAPI
      const sets: WorkoutSetLogPayload[] = [];
      exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          sets.push({
            exerciseId: ex.exerciseId,
            setNumber: s.setNumber,
            actualReps: s.actualReps,
            actualWeightKg: s.actualWeight,
            isCompleted: s.completed,
          });
        });
      });

      const payload: WorkoutSessionPayload = {
        idempotencyKey,
        routineDayId: selectedDay.id,
        startedAt,
        completedAt: new Date().toISOString(),
        rpeScore: Math.min(10, Math.max(1, Math.round(rpe))),
        studentNotes: notes?.trim() || undefined,
        sets,
      };

      // 1. Persistencia local inmediata e inmutable en IndexedDB
      await gymDb.enqueueWorkoutSession(payload);

      // 2. Disparar sincronización en segundo plano
      void syncPendingSessions();

      // Resetear estado activo
      setIsSessionActive(false);
      setIdempotencyKey(null);
      setStartedAt(null);
      setExercises([]);

      return payload;
    },
    [isSessionActive, idempotencyKey, selectedDay, startedAt, exercises, syncPendingSessions]
  );

  const cancelSession = useCallback(() => {
    setIsSessionActive(false);
    setIdempotencyKey(null);
    setStartedAt(null);
    setExercises([]);
  }, []);

  // Métricas derivadas calculadas de forma síncrona en render (según vercel-react-best-practices)
  const { completedSetsCount, totalSetsCount, totalVolumeKg } = useMemo(() => {
    let completed = 0;
    let total = 0;
    let volume = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        total++;
        if (s.completed) {
          completed++;
          volume += s.actualReps * s.actualWeight;
        }
      });
    });

    return {
      completedSetsCount: completed,
      totalSetsCount: total,
      totalVolumeKg: Math.round(volume),
    };
  }, [exercises]);

  const sessionProgress = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  return {
    routine,
    selectedDay,
    exercises,
    isSessionActive,
    isLoading,
    error,
    startedAt,
    completedSetsCount,
    totalSetsCount,
    sessionProgress,
    totalVolumeKg,
    selectDay,
    startSession,
    updateSet,
    toggleSetCompleted,
    finishSession,
    cancelSession,
    refreshRoutine: loadRoutine,
  };
};
