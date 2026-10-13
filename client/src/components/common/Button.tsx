import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptic = true,
  disabled = false,
  children,
  onClick,
  style,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (haptic && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Safe fallback if permission is restricted
      }
    }
    onClick?.(e);
  };

  // Base and Variant Styles
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 600,
    borderRadius: "var(--radius-md)",
    transition: "all 0.15s ease",
    width: fullWidth ? "100%" : "auto",
    opacity: disabled ? 0.45 : 1,
    pointerEvents: disabled ? "none" : "auto",
    letterSpacing: "-0.01em",
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { minHeight: "36px", padding: "0 12px", fontSize: "0.875rem" },
    md: { minHeight: "var(--touch-min)", padding: "0 18px", fontSize: "1rem" },
    lg: { minHeight: "56px", padding: "0 24px", fontSize: "1.0625rem" },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--accent-lime)",
      color: "var(--text-inverse)",
      boxShadow: "0 2px 12px var(--accent-lime-glow)",
    },
    secondary: {
      backgroundColor: "var(--bg-surface-elevated)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--text-primary)",
      border: "1px solid var(--border-default)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
    },
    danger: {
      backgroundColor: "var(--danger)",
      color: "#ffffff",
      boxShadow: "0 2px 10px rgba(239, 68, 68, 0.25)",
    },
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {leftIcon ? <span>{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span>{rightIcon}</span> : null}
    </button>
  );
};
