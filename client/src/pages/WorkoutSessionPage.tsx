import React, { useState, useEffect } from "react";
import { RoutineHeader } from "../components/workout/RoutineHeader";
import { ExerciseCard } from "../components/workout/ExerciseCard";
import { SetRow } from "../components/workout/SetRow";
import { RestTimerSheet } from "../components/workout/RestTimerSheet";
import { FinishWorkoutModal } from "../components/workout/FinishWorkoutModal";
import { WhatsAppFloatingButton } from "../components/workout/WhatsAppFloatingButton";
import { Button } from "../components/common/Button";
import { useActiveWorkoutSession } from "../hooks/useActiveWorkoutSession";
import { useRestTimer } from "../hooks/useRestTimer";
import { useWakeLock } from "../hooks/useWakeLock";

import { ConfirmDialog } from "../components/common/ConfirmDialog";


export interface WorkoutSessionPageProps {
  dayId: string;
  onBackToDashboard: () => void;
}

export const WorkoutSessionPage: React.FC<WorkoutSessionPageProps> = ({
  dayId,
  onBackToDashboard,
}) => {
  const {
    routine,
    selectedDay,
    exercises,
    isSessionActive,
    completedSetsCount,
    totalSetsCount,
    sessionProgress,
    totalVolumeKg,
    startSession,
    updateSet,
    toggleSetCompleted,
    finishSession,
    cancelSession,
  } = useActiveWorkoutSession();

  const {
    secondsRemaining,
    totalSeconds,
    progress,
    isActive: isTimerActive,
    isPaused: isTimerPaused,
    startTimer,
    addSeconds,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useRestTimer();

  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [workoutDurationSec, setWorkoutDurationSec] = useState<number>(0);

  // Mantener la pantalla encendida durante todo el entrenamiento activo
  useWakeLock(isSessionActive);


  // Iniciar automáticamente la sesión si no está activa al entrar a la página
  useEffect(() => {
    if (!isSessionActive && routine) {
      startSession(dayId);
    }
  }, [dayId, isSessionActive, routine, startSession]);

  // Cronómetro general de la sesión
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setWorkoutDurationSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatDuration = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    const restSeconds = toggleSetCompleted(exerciseId, setIndex);
    if (restSeconds && restSeconds > 0) {
      startTimer(restSeconds);
    }
  };

  const handleFinishConfirm = async (rpe: number, notes?: string) => {
    await finishSession(rpe, notes);
    setIsFinishModalOpen(false);
    stopTimer();
    onBackToDashboard();
  };

  const handleConfirmCancel = () => {
    cancelSession();
    stopTimer();
    setIsCancelDialogOpen(false);
    onBackToDashboard();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "16px",
        paddingTop: "calc(var(--safe-top) + 16px)",
        paddingBottom: "calc(var(--safe-bottom) + 96px)",
        gap: "16px",
        maxWidth: "480px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header Superior con Rutina y Conectividad */}
      <RoutineHeader
        routineTitle={routine?.title || "Rutina Activa"}
        dayName={selectedDay?.name || "Entrenamiento en Curso"}
        durationFormatted={formatDuration(workoutDurationSec)}
        sessionProgress={sessionProgress}
        completedSetsCount={completedSetsCount}
        totalSetsCount={totalSetsCount}
        onBack={() => setIsCancelDialogOpen(true)}
      />

      {/* Lista Activa de Ejercicios y Series */}
      <main style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exerciseName={exercise.exerciseName}
            muscleGroup={exercise.muscleGroup}
            videoUrl={exercise.videoUrl}
            executionTips={exercise.executionTips}
            previousSession={exercise.previousPerformance}
            suggestedRestSeconds={exercise.restSeconds}
          >
            {exercise.sets.map((set, setIdx) => (
              <SetRow
                key={`${exercise.exerciseId}-${set.setNumber}`}
                setNumber={set.setNumber}
                targetReps={set.targetReps}
                targetWeight={set.targetWeight}
                actualReps={set.actualReps}
                actualWeight={set.actualWeight}
                completed={set.completed}
                onUpdateActuals={(reps, weight) =>
                  updateSet(exercise.exerciseId, setIdx, { reps, weight })
                }
                onToggleCompleted={() =>
                  handleToggleSet(exercise.exerciseId, setIdx)
                }
              />
            ))}
          </ExerciseCard>
        ))}

        {/* Barra de Acciones Fija en la Zona del Pulgar (Thumb Zone) */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: "480px",
            margin: "0 auto",
            padding: "12px 16px calc(var(--safe-bottom) + 12px) 16px",
            backgroundColor: "rgba(9, 9, 11, 0.94)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--border-default)",
            display: "flex",
            gap: "10px",
            zIndex: 70,
          }}
        >
          <Button
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onClick={() => startTimer(90)}
          >
            ⏱ Descanso
          </Button>
          <Button
            variant="primary"
            size="md"
            style={{ flex: 1.5 }}
            onClick={() => setIsFinishModalOpen(true)}
          >
            Finalizar Sesión →
          </Button>
        </div>
      </main>

      {/* Bottom Sheet del Temporizador de Descanso */}
      <RestTimerSheet
        isOpen={isTimerActive}
        secondsRemaining={secondsRemaining}
        totalSeconds={totalSeconds}
        progress={progress}
        isPaused={isTimerPaused}
        onAddSeconds={addSeconds}
        onTogglePause={isTimerPaused ? resumeTimer : pauseTimer}
        onSkip={stopTimer}
      />

      {/* Modal de Finalización de Entrenamiento */}
      <FinishWorkoutModal
        isOpen={isFinishModalOpen}
        totalVolumeKg={totalVolumeKg}
        completedSets={completedSetsCount}
        totalSets={totalSetsCount}
        onConfirm={handleFinishConfirm}
        onClose={() => setIsFinishModalOpen(false)}
      />

      {/* Modal de Confirmación para Descartar Entrenamiento */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title="¿Abandonar Entrenamiento?"
        description="Los registros de series no guardados de esta sesión se descartarán. ¿Deseas salir al panel principal?"
        confirmLabel="Descartar y Salir"
        cancelLabel="Continuar Entrenando"
        isDestructive={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelDialogOpen(false)}
      />

      {/* Botón Flotante de WhatsApp para Consulta con el PT */}
      <WhatsAppFloatingButton
        currentExercise={
          exercises.find((e) => e.sets.some((s) => !s.completed))?.exerciseName
        }
      />
    </div>
  );
};
