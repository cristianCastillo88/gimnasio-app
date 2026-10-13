import React, { useState, useEffect } from "react";
import { Button } from "../common/Button";
import { trainerApi } from "../../api/apiClient";
import type { StudentSummary, UpdateSubscriptionRequest } from "../../api/types";

export interface UpdateSubscriptionModalProps {
  isOpen: boolean;
  student: StudentSummary | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const UpdateSubscriptionModal: React.FC<UpdateSubscriptionModalProps> = ({
  isOpen,
  student,
  onClose,
  onUpdateSuccess,
}) => {
  const [status, setStatus] = useState<StudentSummary["subscriptionStatus"]>("ACTIVE");
  const [delta, setDelta] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setStatus(student.subscriptionStatus);
      setDelta(0);
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: UpdateSubscriptionRequest = {
        subscriptionStatus: status,
        sessionsRemainingDelta: delta !== 0 ? delta : undefined,
      };

      await trainerApi.updateSubscription(student.id, payload);
      onUpdateSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar la suscripción";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClasses = student.sessionsRemaining;
  const projectedClasses = Math.max(0, currentClasses + delta);

  return (
    <>
      {/* Backdrop */}
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

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Ajustar suscripción y cuota"
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
            Administración Manual
          </span>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
            Cuota de {student.fullName}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
              Estado del Pago
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["ACTIVE", "PENDING", "EXPIRED"] as const).map((s) => {
                const isSelected = status === s;
                const labels = { ACTIVE: "Al Día", PENDING: "Pendiente", EXPIRED: "Vencido" };
                const colors = { ACTIVE: "var(--success)", PENDING: "var(--warning)", EXPIRED: "var(--danger)" };

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1,
                      height: "44px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                      border: `2px solid ${isSelected ? colors[s] : "var(--border-default)"}`,
                      color: isSelected ? colors[s] : "var(--text-secondary)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sessions Delta Adjuster */}
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Ajustar Clases Restantes:
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--accent-lime)" }}>
                {projectedClasses} clases ({delta >= 0 ? `+${delta}` : delta})
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {[+8, +4, +1, -1].map((stepVal) => (
                <button
                  key={stepVal}
                  type="button"
                  onClick={() => setDelta((prev) => prev + stepVal)}
                  style={{
                    flex: 1,
                    height: "38px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {stepVal > 0 ? `+${stepVal}` : stepVal}
                </button>
              ))}
              {delta !== 0 ? (
                <button
                  type="button"
                  onClick={() => setDelta(0)}
                  style={{
                    padding: "0 10px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-muted)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          {error ? (
            <div style={{ color: "var(--danger)", fontSize: "0.8125rem" }}>
              ⚠️ {error}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Confirmar Ajuste"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
