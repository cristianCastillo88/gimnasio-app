import React, { useState } from "react";
import { Button } from "../common/Button";

export interface FinishWorkoutModalProps {
  isOpen: boolean;
  totalVolumeKg: number;
  completedSets: number;
  totalSets: number;
  onConfirm: (rpe: number, notes?: string) => void;
  onClose: () => void;
}

export const FinishWorkoutModal: React.FC<FinishWorkoutModalProps> = ({
  isOpen,
  totalVolumeKg,
  completedSets,
  totalSets,
  onConfirm,
  onClose,
}) => {
  const [rpe, setRpe] = useState<number>(8);
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const rpeDescriptions: Record<number, string> = {
    1: "Esfuerzo nulo",
    2: "Muy liviano",
    3: "Liviano",
    4: "Calentamiento",
    5: "Moderado",
    6: "Esfuerzo medio",
    7: "Exigente (3 reps en reserva)",
    8: "Duro (2 reps en reserva)",
    9: "Muy duro (1 rep en reserva)",
    10: "Fallo muscular absoluto",
  };

  const getRpeColor = (val: number): string => {
    if (val <= 4) return "var(--success)";
    if (val <= 6) return "var(--accent-lime)";
    if (val <= 8) return "var(--warning)";
    return "var(--danger)";
  };

  const handleConfirm = () => {
    onConfirm(rpe, notes);
  };

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
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-label="Finalizar entrenamiento"
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
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.7)",
          animation: "slideUp 0.25s ease",
          maxHeight: "88dvh",
          overflowY: "auto",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--accent-lime)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            ¡Entrenamiento Completado!
          </span>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", marginTop: "2px" }}>
            Registrar Cierre de Sesión
          </h2>
        </div>

        {/* Workout Metrics Summary */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "12px",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Series Logradas</span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
              {completedSets} <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>/ {totalSets}</span>
            </p>
          </div>
          <div style={{ width: "1px", backgroundColor: "var(--border-default)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Volumen Total</span>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-lime)", marginTop: "2px" }}>
              {totalVolumeKg} <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>kg</span>
            </p>
          </div>
        </div>

        {/* Tactile RPE Scale Selector (1-10) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Sensación de Esfuerzo (RPE)
            </label>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: getRpeColor(rpe) }}>
              Nivel {rpe}: {rpeDescriptions[rpe]}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "6px",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
              const isSelected = rpe === val;
              const color = getRpeColor(val);

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRpe(val)}
                  style={{
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? color : "var(--bg-surface-elevated)",
                    color: isSelected ? "var(--text-inverse)" : "var(--text-primary)",
                    border: `1.5px solid ${isSelected ? color : "var(--border-default)"}`,
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.125rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 2px 10px ${color}55` : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Notes for Trainer */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Notas para tu Entrenador (Opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Buena congestión, leve molestia en hombro izquierdo..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
              resize: "none",
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleConfirm}
          >
            ✓ Guardar Entrenamiento
          </Button>
          <Button
            variant="ghost"
            fullWidth
            size="md"
            onClick={onClose}
          >
            Volver a la Sesión
          </Button>
        </div>
      </div>
    </>
  );
};
