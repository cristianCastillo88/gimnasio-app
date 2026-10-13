import React from "react";
import { useTheme } from "../../hooks";

export interface ThemeToggleProps {
  style?: React.CSSProperties;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style, className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "44px",
        height: "44px",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-surface-elevated)",
        border: "1px solid var(--border-default)",
        color: "var(--text-primary)",
        fontSize: "1.125rem",
        cursor: "pointer",
        transition: "transform 0.15s ease, background-color 0.2s ease, border-color 0.2s ease",
        touchAction: "manipulation",
        flexShrink: 0,
        ...style,
      }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(0.92)";
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
      onPointerLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
};
