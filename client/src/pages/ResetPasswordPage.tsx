import React, { useState, useEffect } from "react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { NetworkStatusBadge } from "../components/common/NetworkStatusBadge";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { authApi } from "../api/apiClient";
import type { VerifyResetTokenResponse } from "../api/types";

export interface ResetPasswordPageProps {
  token: string;
  onResetSuccess: () => void;
  onCancel: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token,
  onResetSuccess,
  onCancel,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [verificationData, setVerificationData] = useState<VerifyResetTokenResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      setIsVerifying(true);
      setVerificationError(null);
      try {
        const data = await authApi.verifyResetToken(token);
        if (isMounted) {
          setVerificationData(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "El enlace de restablecimiento es inválido o ha expirado.";
          setVerificationError(message);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    void verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // OWASP checklist
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isFormValid) {
      setFormError("Por favor cumple con todos los requisitos de seguridad de la contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword: password,
      });
      onResetSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al restablecer la contraseña. Es posible que el enlace haya expirado.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "24px 20px",
        paddingTop: "calc(var(--safe-top) + 24px)",
        paddingBottom: "calc(var(--safe-bottom) + 24px)",
        justifyContent: "center",
        maxWidth: "420px",
        margin: "0 auto",
        width: "100%",
        gap: "24px",
      }}
    >
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
        <NetworkStatusBadge />
        <ThemeToggle style={{ width: "36px", height: "36px", fontSize: "1rem" }} />
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "var(--accent-lime-dim)",
            border: "1px solid var(--accent-lime)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            marginBottom: "12px",
          }}
        >
          🔐
        </div>
        <h1 style={{ fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
          Restablecer Contraseña
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Crea una nueva contraseña segura para tu cuenta
        </p>
      </div>

      {/* Loading State */}
      {isVerifying && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid var(--border-default)",
              borderTopColor: "var(--accent-lime)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Verificando enlace de restablecimiento...
          </p>
        </div>
      )}

      {/* Error / Expired State */}
      {!isVerifying && verificationError && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem" }}>⚠️</div>
          <div>
            <h2 style={{ fontSize: "1.125rem", color: "var(--danger)", marginBottom: "6px" }}>
              Enlace Inválido o Expirado
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              El enlace de recuperación ya fue utilizado o venció. Por favor solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            style={{ height: "46px" }}
            onClick={onCancel}
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      )}

      {/* Valid Token Form State */}
      {!isVerifying && !verificationError && verificationData && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              borderLeft: "4px solid var(--accent-lime)",
            }}
          >
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
              ¡Hola, {verificationData.fullName}! 👋
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Crea tu nueva contraseña para acceder a tu cuenta (<strong>{verificationData.email}</strong>).
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <Input
              label="Nueva Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caract. (mayús, núm, símb)"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              style={{
                position: "absolute",
                right: "12px",
                top: "34px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
                color: "var(--text-muted)",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Checklist interactivo de complejidad OWASP */}
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "2px" }}>
              Requisitos de seguridad (OWASP 2025):
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div style={{ color: hasMinLength ? "var(--accent-lime)" : "var(--text-muted)" }}>
                {hasMinLength ? "✓" : "○"} 8+ caracteres
              </div>
              <div style={{ color: hasUpper ? "var(--accent-lime)" : "var(--text-muted)" }}>
                {hasUpper ? "✓" : "○"} Una mayúscula
              </div>
              <div style={{ color: hasLower ? "var(--accent-lime)" : "var(--text-muted)" }}>
                {hasLower ? "✓" : "○"} Una minúscula
              </div>
              <div style={{ color: hasNumber ? "var(--accent-lime)" : "var(--text-muted)" }}>
                {hasNumber ? "✓" : "○"} Un número
              </div>
              <div style={{ color: hasSpecial ? "var(--accent-lime)" : "var(--text-muted)", gridColumn: "span 2" }}>
                {hasSpecial ? "✓" : "○"} Un símbolo especial (!@#$...)
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Input
              label="Confirmar Contraseña"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar confirmación" : "Ver confirmación"}
              style={{
                position: "absolute",
                right: "12px",
                top: "34px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1rem",
                color: "var(--text-muted)",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div
              style={{
                fontSize: "0.8125rem",
                color: passwordsMatch ? "var(--accent-lime)" : "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "-6px",
              }}
            >
              <span>{passwordsMatch ? "✓" : "✕"}</span>
              <span>{passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}</span>
            </div>
          )}

          {formError && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isFormValid}
            style={{ height: "48px", fontSize: "1rem", fontWeight: 700, marginTop: "4px" }}
          >
            {isSubmitting ? "Restableciendo clave..." : "Guardar y Acceder 🚀"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            style={{ height: "40px", fontSize: "0.8125rem" }}
            onClick={onCancel}
          >
            Cancelar / Iniciar sesión
          </Button>
        </form>
      )}
    </div>
  );
};
