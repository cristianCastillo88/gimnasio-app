import React, { useState } from "react";
import { Badge } from "../common/Badge";
import type { PreviousExercisePerformance } from "../../api/types";

export interface ExerciseCardProps {
  exerciseName: string;
  muscleGroup: string;
  videoUrl?: string;
  executionTips?: string;
  previousSession?: PreviousExercisePerformance;
  suggestedRestSeconds: number;
  children: React.ReactNode;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exerciseName,
  muscleGroup,
  videoUrl,
  executionTips,
  previousSession,
  suggestedRestSeconds,
  children,
}) => {
  const [showTips, setShowTips] = useState<boolean>(false);

  // Formatear resumen de la sesión previa
  const previousSummary = previousSession?.sets && previousSession.sets.length > 0
    ? `${previousSession.sets.length} series • ${previousSession.sets[0].weightKg} kg × ${previousSession.sets[0].reps} reps`
    : null;

  return (
    <article
      className="list-item-optimized"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 12px",
      }}
    >
      {/* Exercise Title and Muscle Badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: "var(--font-title-fluid, 1.125rem)", color: "var(--text-primary)", marginBottom: "6px", wordBreak: "break-word" }}>
            {exerciseName}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <Badge label={muscleGroup} variant="muscle" />
            <Badge label={`⏱ ${suggestedRestSeconds}s descanso`} variant="neutral" />
          </div>
        </div>

        {/* Video or Tips Toggle Button */}
        {executionTips || videoUrl ? (
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: showTips ? "var(--accent-lime)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span>{showTips ? "Ocultar tips" : "Ver tips"}</span>
          </button>
        ) : null}
      </div>

      {/* Expandable Execution Tips / Video Link */}
      {Boolean(showTips && (executionTips || videoUrl)) ? (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          {executionTips ? <p style={{ margin: 0, lineHeight: 1.4 }}>💡 {executionTips}</p> : null}
          {videoUrl ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--accent-cyan)",
                fontWeight: 600,
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ▶ Ver video demostrativo
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Progressive Overload Callout */}
      {previousSummary ? (
        <div
          style={{
            backgroundColor: "rgba(132, 204, 22, 0.08)",
            border: "1px solid rgba(132, 204, 22, 0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "6px",
            fontSize: "0.8125rem",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
            ⚡ Última sesión:
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--accent-lime)",
              wordBreak: "break-word",
            }}
          >
            {previousSummary}
          </span>
        </div>
      ) : null}

      {/* Sets Column Headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 4px",
          marginTop: "4px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <span style={{ width: "28px", textAlign: "center", flexShrink: 0 }}>Set</span>
        <div style={{ display: "flex", gap: "6px", flex: 1, minWidth: 0 }}>
          <span style={{ flex: 1, textAlign: "center", minWidth: 0 }}>Peso (kg)</span>
          <span style={{ flex: 1, textAlign: "center", minWidth: 0 }}>Reps</span>
        </div>
        <span style={{ width: "48px", textAlign: "center", flexShrink: 0 }}>Listo</span>
      </div>

      {/* Sets List (Slot Children) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {children}
      </div>
    </article>
  );
};
