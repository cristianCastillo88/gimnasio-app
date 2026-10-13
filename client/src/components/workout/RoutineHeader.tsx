import React from "react";
import { NetworkStatusBadge } from "../common/NetworkStatusBadge";
import { ThemeToggle } from "../common/ThemeToggle";

export interface RoutineHeaderProps {
  routineTitle: string;
  dayName: string;
  durationFormatted?: string;
  sessionProgress?: number; // 0 a 100
  completedSetsCount?: number;
  totalSetsCount?: number;
  onBack?: () => void;
}

export const RoutineHeader: React.FC<RoutineHeaderProps> = ({
  routineTitle,
  dayName,
  durationFormatted = "00:00",
  sessionProgress = 0,
  completedSetsCount = 0,
  totalSetsCount = 0,
  onBack,
}) => {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              style={{
                width: "36px",
                height: "36px",
                minWidth: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              ←
            </button>
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "var(--accent-lime)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {routineTitle}
            </span>
            <h1
              style={{
                fontSize: "var(--font-title-fluid, 1.125rem)",
                margin: "2px 0 0 0",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {dayName}
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <NetworkStatusBadge />
          <ThemeToggle style={{ width: "36px", height: "36px", fontSize: "1rem" }} />
        </div>
      </div>

      {/* Progress & Duration Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Series:
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {completedSetsCount}/{totalSetsCount} ({sessionProgress}%)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>⏱</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--accent-lime)",
            }}
          >
            {durationFormatted}
          </span>
        </div>
      </div>

      {/* Visual Progress Track */}
      <div
        style={{
          width: "100%",
          height: "4px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, sessionProgress))}%`,
            backgroundColor: "var(--accent-lime)",
            borderRadius: "var(--radius-full)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </header>
  );
};
