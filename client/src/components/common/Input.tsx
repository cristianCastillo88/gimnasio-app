import React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  unit?: string;
  stepper?: {
    step: number;
    onStep: (delta: number) => void;
  };
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  unit,
  stepper,
  disabled = false,
  style,
  inputMode = "text",
  ...rest
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label ? (
        <label
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </label>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          backgroundColor: "var(--bg-surface)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          minHeight: "var(--touch-min)",
          transition: "border-color 0.15s ease",
        }}
      >
        {stepper ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => stepper.onStep(-stepper.step)}
            aria-label={`Restar ${stepper.step}`}
            style={{
              width: "32px",
              minWidth: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-surface-elevated)",
              color: "var(--text-primary)",
              fontSize: "1.125rem",
              fontWeight: 700,
              borderRight: "1px solid var(--border-default)",
              cursor: disabled ? "not-allowed" : "pointer",
              touchAction: "manipulation",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            -
          </button>

        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            minWidth: 0,
            padding: stepper ? "0 2px" : "0 12px",
            gap: stepper ? "2px" : "6px",
            overflow: "hidden",
          }}
        >
          <input
            {...rest}
            disabled={disabled}
            inputMode={inputMode}
            style={{
              width: "100%",
              minWidth: 0,
              flex: 1,
              height: "100%",
              minHeight: "44px",
              textAlign: stepper ? "center" : "left",
              fontFamily: "var(--font-mono)",
              fontSize: stepper ? "1.0625rem" : "1.125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              padding: 0,
              ...style,
            }}
          />
          {unit ? (
            <span
              style={{
                fontSize: stepper ? "0.6875rem" : "0.875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              {unit}
            </span>
          ) : null}
        </div>

        {stepper ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => stepper.onStep(stepper.step)}
            aria-label={`Sumar ${stepper.step}`}
            style={{
              width: "32px",
              minWidth: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-surface-elevated)",
              color: "var(--accent-lime)",
              fontSize: "1.125rem",
              fontWeight: 700,
              borderLeft: "1px solid var(--border-default)",
              cursor: disabled ? "not-allowed" : "pointer",
              touchAction: "manipulation",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            +
          </button>

        ) : null}
      </div>

      {error ? (
        <span style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textAlign: stepper ? "center" : "left",
            display: "block",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
