import React from "react";
import { Button } from "../common/Button";

export interface RestTimerSheetProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  progress: number;
  isPaused: boolean;
  onAddSeconds: (delta: number) => void;
  onTogglePause: () => void;
  onSkip: () => void;
}

export const RestTimerSheet: React.FC<RestTimerSheetProps> = ({
  isOpen,
  secondsRemaining,
  totalSeconds,
  progress,
  isPaused,
  onAddSeconds,
  onTogglePause,
  onSkip,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onSkip}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 90,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Bottom Sheet Drawer */}
      <aside
        role="dialog"
        aria-label="Temporizador de descanso"
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
          alignItems: "center",
          gap: "18px",
          zIndex: 100,
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.6)",
          animation: "slideUp 0.25s ease",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        {/* Handle Pill */}
        <div
          style={{
            width: "36px",
            height: "4px",
            backgroundColor: "var(--border-default)",
            borderRadius: "var(--radius-full)",
          }}
        />

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
            Tiempo de Descanso
          </span>
          <h2 style={{ fontSize: "1.125rem", marginTop: "2px" }}>
            {isPaused ? "Descanso en Pausa" : "Recuperando energía..."}
          </h2>
        </div>

        {/* Circular Countdown Display */}
        <div
          style={{
            position: "relative",
            width: "160px",
            height: "160px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* SVG Progress Circle */}
          <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="transparent"
              stroke="var(--bg-surface-elevated)"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="transparent"
              stroke={isPaused ? "var(--warning)" : "var(--accent-lime)"}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={(1 - progress) * 2 * Math.PI * 70}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>

          {/* Time text centered */}
          <div style={{ position: "absolute", textAlign: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "2.5rem",
                fontWeight: 800,
                color: isPaused ? "var(--warning)" : "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              {formattedTime}
            </span>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Total: {totalSeconds}s
            </p>
          </div>
        </div>

        {/* Quick Stepper Controls (+30s / -15s) */}
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <Button
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onClick={() => onAddSeconds(-15)}
          >
            -15s
          </Button>
          <Button
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onClick={onTogglePause}
          >
            {isPaused ? "Reanudar" : "Pausar"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onClick={() => onAddSeconds(30)}
          >
            +30s
          </Button>
        </div>

        {/* Skip Rest Button */}
        <Button
          variant="outline"
          fullWidth
          size="md"
          onClick={onSkip}
        >
          Omitir Descanso y Continuar →
        </Button>
      </aside>
    </>
  );
};
