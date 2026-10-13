import React, { useState } from "react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { trainerApi } from "../../api/apiClient";
import type { StudentSummary, RoutineTemplateSummary } from "../../api/types";

export interface AssignRoutineModalProps {
  isOpen: boolean;
  student: StudentSummary | null;
  routines: RoutineTemplateSummary[];
  onClose: () => void;
  onAssignedSuccess: (routineTitle: string) => void;
}

export const AssignRoutineModal: React.FC<AssignRoutineModalProps> = ({
  isOpen,
  student,
  routines,
  onClose,
  onAssignedSuccess,
}) => {
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutineId) {
      setError("Por favor selecciona una rutina para asignar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selected = routines.find((r) => r.id === selectedRoutineId);
      await trainerApi.assignRoutine({
        studentId: student.id,
        routineTemplateId: selectedRoutineId,
      });

      onAssignedSuccess(selected?.title || "Rutina");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al asignar la rutina";
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
        aria-label={`Asignar rutina a ${student.fullName}`}
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
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase" }}>
            Asignación de Entrenamiento
          </span>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
            Asignar Rutina a {student.fullName}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Rutina actual: <strong style={{ color: "var(--text-primary)" }}>{student.assignedRoutineTitle || "Sin asignar"}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Selecciona una Plantilla ({routines.length} disponibles):
            </span>

            {routines.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-default)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                }}
              >
                No tienes plantillas de rutina creadas aún. Crea una desde la pestaña &quot;Rutinas&quot;.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                {routines.map((routine) => {
                  const isSelected = selectedRoutineId === routine.id;
                  return (
                    <div
                      key={routine.id}
                      onClick={() => setSelectedRoutineId(routine.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isSelected ? "var(--bg-surface-active)" : "var(--bg-surface-elevated)",
                        border: `1px solid ${isSelected ? "var(--accent-lime)" : "var(--border-default)"}`,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: isSelected ? "var(--accent-lime)" : "var(--text-primary)" }}>
                          {routine.title}
                        </span>
                        {routine.description ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {routine.description}
                          </span>
                        ) : null}
                        <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                          <Badge label={`${routine.daysCount} Días`} variant="neutral" />
                          <Badge label={`${routine.exercisesCount} Ejercicios`} variant="muscle" />
                        </div>
                      </div>

                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: `2px solid ${isSelected ? "var(--accent-lime)" : "var(--border-default)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "var(--accent-lime)" : "transparent",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected ? (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--bg-primary)" }} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              style={{ flex: 1.5 }}
              disabled={isSubmitting || !selectedRoutineId || routines.length === 0}
            >
              {isSubmitting ? "Asignando..." : "Asignar Rutina"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
