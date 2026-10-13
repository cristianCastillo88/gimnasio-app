import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { trainerApi } from "../../api/apiClient";
import type {
  Exercise,
  UpdateRoutineTemplateRequest,
  CreateRoutineDayRequest,
  CreateRoutineExerciseRequest,
} from "../../api/types";

export interface EditRoutineModalProps {
  routineId: string | null;
  isOpen: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onRoutineUpdated: () => void;
}

export const EditRoutineModal: React.FC<EditRoutineModalProps> = ({
  routineId,
  isOpen,
  exercises,
  onClose,
  onRoutineUpdated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [days, setDays] = useState<Array<{ name: string; exerciseItems: CreateRoutineExerciseRequest[] }>>([]);

  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && routineId) {
      let isMounted = true;
      setIsLoadingDetails(true);
      setError(null);

      trainerApi
        .getRoutineById(routineId)
        .then((detail) => {
          if (!isMounted) return;
          setTitle(detail.title || "");
          setDescription(detail.description || "");

          const formattedDays = detail.days.map((d) => ({
            name: d.name,
            exerciseItems: d.exercises.map((e, eIdx) => ({
              exerciseId: e.exerciseId,
              orderIndex: eIdx + 1,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              suggestedWeightKg: e.suggestedWeightKg ?? undefined,
              suggestedRestSeconds: e.suggestedRestSeconds ?? 90,
            })),
          }));

          setDays(formattedDays);
        })
        .catch((err: unknown) => {
          if (!isMounted) return;
          const message = err instanceof Error ? err.message : "Error al cargar el detalle de la rutina";
          setError(message);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingDetails(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, routineId]);

  if (!isOpen || !routineId) return null;

  const handleAddDay = () => {
    setDays((prev) => [
      ...prev,
      {
        name: `Día ${String.fromCharCode(65 + prev.length)}`,
        exerciseItems: [],
      },
    ]);
  };

  const handleAddExerciseToDay = (dayIndex: number, exerciseId: string) => {
    if (!exerciseId) return;

    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;

        const newEx: CreateRoutineExerciseRequest = {
          exerciseId,
          orderIndex: day.exerciseItems.length + 1,
          targetSets: 3,
          targetReps: "8-10",
          suggestedWeightKg: 50,
          suggestedRestSeconds: 90,
        };

        return { ...day, exerciseItems: [...day.exerciseItems, newEx] };
      })
    );
  };

  const handleRemoveExerciseFromDay = (dayIndex: number, exIndex: number) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          exerciseItems: day.exerciseItems.filter((_, eIdx) => eIdx !== exIndex),
        };
      })
    );
  };

  const handleMoveExercise = (dayIndex: number, exIndex: number, direction: "up" | "down") => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const targetIndex = direction === "up" ? exIndex - 1 : exIndex + 1;
        if (targetIndex < 0 || targetIndex >= day.exerciseItems.length) return day;

        const updated = [...day.exerciseItems];
        const [moved] = updated.splice(exIndex, 1);
        updated.splice(targetIndex, 0, moved);
        const reindexed = updated.map((item, i) => ({ ...item, orderIndex: i + 1 }));
        return { ...day, exerciseItems: reindexed };
      })
    );
  };


  const handleUpdateExerciseItem = (
    dayIndex: number,
    exIndex: number,
    patch: Partial<CreateRoutineExerciseRequest>
  ) => {
    setDays((prev) =>
      prev.map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;
        return {
          ...day,
          exerciseItems: day.exerciseItems.map((item, eIdx) => {
            if (eIdx !== exIndex) return item;
            return { ...item, ...patch };
          }),
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Por favor ingresa un título para la rutina.");
      return;
    }

    if (days.length === 0) {
      setError("La rutina debe tener al menos un día programado.");
      return;
    }

    if (days.some((d) => d.exerciseItems.length === 0)) {
      setError("Todos los días deben tener al menos un ejercicio asignado.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payloadDays: CreateRoutineDayRequest[] = days.map((day, dayIdx) => ({
        name: day.name,
        orderIndex: dayIdx + 1,
        exercises: day.exerciseItems.map((ex, eIdx) => ({
          ...ex,
          orderIndex: eIdx + 1,
        })),
      }));

      const payload: UpdateRoutineTemplateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        days: payloadDays,
      };

      await trainerApi.updateRoutine(routineId, payload);
      onRoutineUpdated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar la rutina";
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
        aria-label="Editor de plantillas de rutina"
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
            Editor de Rutinas
          </span>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
            Editar Plantilla
          </h2>
        </div>

        {isLoadingDetails ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
            ⏳ Cargando datos de la rutina...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Input
              label="Título de la Plantilla *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Hipertrofia 3 Días (Fuerza y Masa)"
              required
            />

            <Input
              label="Descripción del Enfoque"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Frecuencia 2 con sobrecarga progresiva"
            />

            {/* Builder for Routine Days */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Estructura de Días ({days.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddDay}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--accent-lime)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    padding: "6px 8px",
                  }}
                >
                  + Agregar Día
                </button>
              </div>

              {days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      value={day.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDays((prev) =>
                          prev.map((d, i) => (i === dayIdx ? { ...d, name: val } : d))
                        );
                      }}
                      style={{
                        flex: 1,
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        backgroundColor: "var(--bg-surface)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-default)",
                      }}
                    />
                  </div>

                  {/* Exercises inside Day */}
                  {day.exerciseItems.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {day.exerciseItems.map((exItem, exIdx) => {
                        const exDef = exercises.find((e) => e.id === exItem.exerciseId);
                        return (
                          <div
                            key={exIdx}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              backgroundColor: "var(--bg-surface)",
                              padding: "10px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: "0.8125rem",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {exDef?.name || "Ejercicio"}
                                </p>
                                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                                  {exDef?.muscleGroup || "Músculo"}
                                </span>
                              </div>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                              <button
                                type="button"
                                disabled={exIdx === 0}
                                onClick={() => handleMoveExercise(dayIdx, exIdx, "up")}
                                aria-label="Mover ejercicio arriba"
                                style={{
                                  color: exIdx === 0 ? "var(--text-muted)" : "var(--text-primary)",
                                  fontSize: "0.75rem",
                                  cursor: exIdx === 0 ? "not-allowed" : "pointer",
                                  padding: "4px 6px",
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-default)",
                                  opacity: exIdx === 0 ? 0.35 : 1,
                                }}
                              >
                                ⬆️
                              </button>
                              <button
                                type="button"
                                disabled={exIdx === day.exerciseItems.length - 1}
                                onClick={() => handleMoveExercise(dayIdx, exIdx, "down")}
                                aria-label="Mover ejercicio abajo"
                                style={{
                                  color: exIdx === day.exerciseItems.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                                  fontSize: "0.75rem",
                                  cursor: exIdx === day.exerciseItems.length - 1 ? "not-allowed" : "pointer",
                                  padding: "4px 6px",
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-default)",
                                  opacity: exIdx === day.exerciseItems.length - 1 ? 0.35 : 1,
                                }}
                              >
                                ⬇️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExerciseFromDay(dayIdx, exIdx)}
                                aria-label={`Eliminar ${exDef?.name || "ejercicio"}`}
                                style={{
                                  color: "var(--danger)",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                  padding: "4px 8px",
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-default)",
                                }}
                              >
                                ✕ Quitar
                              </button>
                            </div>
                          </div>


                            {/* Editable configuration fields for sets, reps, kg, and rest */}
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", paddingTop: "6px", borderTop: "1px dashed var(--border-subtle)" }}>
                              <label style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                                Series:
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={exItem.targetSets}
                                  onChange={(e) => handleUpdateExerciseItem(dayIdx, exIdx, { targetSets: parseInt(e.target.value, 10) || 1 })}
                                  style={{ width: "38px", padding: "3px 4px", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-default)", borderRadius: "4px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                                />
                              </label>
                              <label style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                                Reps:
                                <input
                                  type="text"
                                  value={exItem.targetReps}
                                  onChange={(e) => handleUpdateExerciseItem(dayIdx, exIdx, { targetReps: e.target.value })}
                                  style={{ width: "56px", padding: "3px 4px", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-default)", borderRadius: "4px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                                />
                              </label>
                              <label style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                                Kg:
                                <input
                                  type="number"
                                  step="2.5"
                                  min="0"
                                  value={exItem.suggestedWeightKg ?? ""}
                                  onChange={(e) => handleUpdateExerciseItem(dayIdx, exIdx, { suggestedWeightKg: parseFloat(e.target.value) || 0 })}
                                  style={{ width: "48px", padding: "3px 4px", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-default)", borderRadius: "4px", textAlign: "center", fontSize: "0.75rem", color: "var(--accent-lime)", fontWeight: 700, fontFamily: "var(--font-mono)" }}
                                />
                              </label>
                              <label style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                                Descanso:
                                <input
                                  type="number"
                                  step="15"
                                  min="0"
                                  value={exItem.suggestedRestSeconds}
                                  onChange={(e) => handleUpdateExerciseItem(dayIdx, exIdx, { suggestedRestSeconds: parseInt(e.target.value, 10) || 0 })}
                                  style={{ width: "48px", padding: "3px 4px", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-default)", borderRadius: "4px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                                />
                                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>s</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                      Sin ejercicios asignados a este día.
                    </p>
                  )}

                  {/* Add Exercise to this Day */}
                  {exercises.length > 0 ? (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddExerciseToDay(dayIdx, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px dashed var(--border-focus)",
                        color: "var(--accent-lime)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>
                        + Seleccionar ejercicio de la biblioteca...
                      </option>
                      {Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort().map((group) => (
                        <optgroup key={group} label={`── ${group} ──`}>
                          {exercises
                            .filter((ex) => ex.muscleGroup === group)
                            .map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>

            {error ? (
              <div style={{ color: "var(--danger)", fontSize: "0.8125rem" }}>
                ⚠️ {error}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
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
        )}
      </div>
    </>
  );
};
