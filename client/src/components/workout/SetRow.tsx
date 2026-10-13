import React, { memo } from "react";
import { Input } from "../common/Input";

export interface SetRowProps {
  setNumber: number;
  targetReps: string;
  targetWeight: number;
  actualReps: number;
  actualWeight: number;
  completed: boolean;
  onUpdateActuals: (reps: number, weight: number) => void;
  onToggleCompleted: () => void;
}

export const SetRow: React.FC<SetRowProps> = memo(({
  setNumber,
  targetReps,
  targetWeight,
  actualReps,
  actualWeight,
  completed,
  onUpdateActuals,
  onToggleCompleted,
}) => {
  const handleWeightDelta = (delta: number) => {
    const next = Math.max(0, parseFloat((actualWeight + delta).toFixed(1)));
    onUpdateActuals(actualReps, next);
  };

  const handleRepsDelta = (delta: number) => {
    const next = Math.max(0, actualReps + delta);
    onUpdateActuals(next, actualWeight);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 4px",
        backgroundColor: completed ? "rgba(24, 24, 27, 0.45)" : "var(--bg-surface-elevated)",
        border: `1px solid ${completed ? "var(--border-subtle)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        opacity: completed ? 0.75 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {/* Set Number Indicator */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: completed ? "var(--accent-lime-dim)" : "var(--bg-surface)",
          border: `1px solid ${completed ? "var(--accent-lime)" : "var(--border-default)"}`,
          fontSize: "0.8125rem",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: completed ? "var(--accent-lime)" : "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        {setNumber}
      </div>

      {/* Inputs for Weight and Reps */}
      <div style={{ display: "flex", gap: "6px", flex: 1, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            value={actualWeight}
            inputMode="decimal"
            disabled={completed}
            onChange={(e) => onUpdateActuals(actualReps, parseFloat(e.target.value) || 0)}
            stepper={{
              step: 2.5,
              onStep: handleWeightDelta,
            }}
            helperText={targetWeight > 0 ? `Obj: ${targetWeight}kg` : undefined}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            value={actualReps}
            inputMode="numeric"
            disabled={completed}
            onChange={(e) => onUpdateActuals(parseInt(e.target.value, 10) || 0, actualWeight)}
            stepper={{
              step: 1,
              onStep: handleRepsDelta,
            }}
            helperText={targetReps ? `Obj: ${targetReps}` : undefined}
          />
        </div>
      </div>

      {/* Giant Circular Completion Button (Min 48x48px Touch Target) */}
      <button
        type="button"
        onClick={onToggleCompleted}
        aria-label={completed ? `Desmarcar serie ${setNumber}` : `Completar serie ${setNumber}`}
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: completed ? "var(--accent-lime)" : "transparent",
          border: `2px solid ${completed ? "var(--accent-lime)" : "var(--border-default)"}`,
          color: completed ? "var(--text-inverse)" : "var(--text-muted)",
          fontSize: "1.25rem",
          fontWeight: 800,
          boxShadow: completed ? "0 2px 12px var(--accent-lime-glow)" : "none",
          transition: "all 0.15s ease",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {completed ? "✓" : "○"}
      </button>
    </div>
  );
});

SetRow.displayName = "SetRow";
