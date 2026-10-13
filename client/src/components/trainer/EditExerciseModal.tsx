import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { trainerApi } from "../../api/apiClient";
import type { Exercise, UpdateExerciseRequest } from "../../api/types";

export interface EditExerciseModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onExerciseUpdated: () => void;
}

const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Core",
  "Glúteos",
];

export const EditExerciseModal: React.FC<EditExerciseModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onExerciseUpdated,
}) => {
  const [name, setName] = useState<string>("");
  const [muscleGroup, setMuscleGroup] = useState<string>("Pecho");
  const [movementPattern, setMovementPattern] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [executionTips, setExecutionTips] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || "");
      setMuscleGroup(exercise.muscleGroup || "Pecho");
      setMovementPattern(exercise.movementPattern || "");
      setVideoUrl(exercise.videoUrl || "");
      setExecutionTips(exercise.executionTips || "");
      setError(null);
    }
  }, [exercise]);

  if (!isOpen || !exercise) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del ejercicio es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: UpdateExerciseRequest = {
        name: name.trim(),
        muscleGroup,
        movementPattern: movementPattern.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        executionTips: executionTips.trim() || undefined,
      };

      await trainerApi.updateExercise(exercise.id, payload);
      onExerciseUpdated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar el ejercicio";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 110,
        }}
      />

      <div
        role="dialog"
        aria-label="Editar ejercicio existente"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "480px",
          margin: "0 auto",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          padding: "20px 20px calc(var(--safe-bottom) + 20px) 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          zIndex: 120,
          maxHeight: "88dvh",
          overflowY: "auto",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase" }}>
            Biblioteca de Ejercicios
          </span>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
            Editar Ejercicio
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input
            label="Nombre del Ejercicio *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Press Francés con Barra Z"
            required
          />

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "6px" }}>
              Grupo Muscular Principal
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {MUSCLE_GROUPS.map((mg) => {
                const isSelected = muscleGroup === mg;
                return (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => setMuscleGroup(mg)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: isSelected ? "var(--accent-lime)" : "var(--bg-surface-elevated)",
                      color: isSelected ? "var(--text-inverse)" : "var(--text-secondary)",
                      border: `1px solid ${isSelected ? "var(--accent-lime)" : "var(--border-default)"}`,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: "36px",
                    }}
                  >
                    {mg}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Patrón de Movimiento"
            value={movementPattern}
            onChange={(e) => setMovementPattern(e.target.value)}
            placeholder="Ej. Extensión de codo, Tracción"
          />

          <Input
            label="Enlace de Video (YouTube / Demo)"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
              Tips Técnicos de Ejecución
            </label>
            <textarea
              value={executionTips}
              onChange={(e) => setExecutionTips(e.target.value)}
              placeholder="Ej. Mantener codos fijos, descenso controlado..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error ? (
            <div style={{ color: "var(--danger)", fontSize: "0.8125rem" }}>
              ⚠️ {error}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <Button
              type="button"
              variant="ghost"
              style={{ flex: 1, minHeight: "44px" }}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              style={{ flex: 1.5, minHeight: "44px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
