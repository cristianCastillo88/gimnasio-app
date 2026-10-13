import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";
import { trainerApi } from "../../api/apiClient";
import type { StudentSummary, StudentWorkoutHistoryResponse } from "../../api/types";

export interface StudentWorkoutHistoryModalProps {
  isOpen: boolean;
  student: StudentSummary | null;
  onClose: () => void;
}

export const StudentWorkoutHistoryModal: React.FC<StudentWorkoutHistoryModalProps> = ({
  isOpen,
  student,
  onClose,
}) => {
  const [history, setHistory] = useState<StudentWorkoutHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student || !isOpen) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trainerApi.getStudentWorkouts(student.id);
        setHistory(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al consultar historial del alumno";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

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
        aria-label="Historial de entrenamientos del alumno"
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase" }}>
              Seguimiento de Cargas & RPE
            </span>
            <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px", wordBreak: "break-word" }}>
              Progreso de {student.fullName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
            Cargando historial de sesiones...
          </div>
        ) : error ? (
          <div style={{ color: "var(--danger)", padding: "12px", backgroundColor: "var(--danger-dim)", borderRadius: "var(--radius-md)" }}>
            ⚠️ {error}
          </div>
        ) : !history || history.sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 16px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "var(--radius-md)" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              El alumno aún no ha sincronizado sesiones de entrenamiento.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.sessions.map((session, sIdx) => {
              const formattedDate = new Date(session.completedAt).toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={sIdx}
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", margin: 0, color: "var(--text-primary)" }}>
                        {session.routineDayName}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {formattedDate}
                      </span>
                    </div>
                    <Badge label={`RPE ${session.rpeScore}`} variant={session.rpeScore >= 8 ? "danger" : "lime"} />
                  </div>

                  {session.studentNotes ? (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-surface)",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                      }}
                    >
                      💬 "{session.studentNotes}"
                    </div>
                  ) : null}

                  {/* Sets Summary Table */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {session.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8125rem",
                          padding: "4px 0",
                          borderBottom: setIdx < session.sets.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                      >
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {set.exerciseName} (#{set.setNumber})
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-lime)", fontWeight: 700 }}>
                          {set.actualWeightKg} kg × {set.actualReps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="secondary" fullWidth size="md" onClick={onClose}>
          Cerrar Historial
        </Button>
      </div>
    </>
  );
};
