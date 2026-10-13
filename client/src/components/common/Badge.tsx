import React from "react";

export type BadgeVariant = "muscle" | "success" | "warning" | "danger" | "neutral" | "lime";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "neutral",
  icon,
}) => {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    muscle: {
      backgroundColor: "var(--accent-cyan-dim)",
      color: "var(--accent-cyan)",
      border: "1px solid rgba(6, 182, 212, 0.3)",
    },
    lime: {
      backgroundColor: "var(--accent-lime-dim)",
      color: "var(--accent-lime)",
      border: "1px solid rgba(132, 204, 22, 0.3)",
    },
    success: {
      backgroundColor: "var(--success-dim)",
      color: "var(--success)",
      border: "1px solid rgba(16, 185, 129, 0.3)",
    },
    warning: {
      backgroundColor: "var(--warning-dim)",
      color: "var(--warning)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    danger: {
      backgroundColor: "var(--danger-dim)",
      color: "var(--danger)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
    neutral: {
      backgroundColor: "var(--bg-surface-elevated)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        ...variantStyles[variant],
      }}
    >
      {icon ? <span>{icon}</span> : null}
      <span>{label}</span>
    </span>
  );
};
