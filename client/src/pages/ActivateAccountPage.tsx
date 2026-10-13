import React, { useState, useEffect } from "react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { NetworkStatusBadge } from "../components/common/NetworkStatusBadge";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { authApi } from "../api/apiClient";
import type { VerifyActivationTokenResponse } from "../api/types";

export interface ActivateAccountPageProps {
  token: string;
  onActivationSuccess: () => void;
  onCancel: () => void;
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({
  token,
  onActivationSuccess,
  onCancel,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [verificationData, setVerificationData] = useState<VerifyActivationTokenResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      setIsVerifying(true);
      setVerificationError(null);
      try {
        const data = await authApi.verifyActivationToken(token);
        if (isMounted) {
          setVerificationData(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "El enlace de activación es inválido o ha expirado.";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setFormError("La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo especial (!@#$...).");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.activateAccount({
        token,
        newPassword: password,
      });
      onActivationSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al activar la cuenta.";
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
        maxWidth: "440px",
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
          💪
        </div>
        <h1 style={{ fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
          GymApp
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Activación de cuenta de alumno
        </p>
      </div>

      {/* Verifying Token State */}
      {isVerifying && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid var(--border-default)",
              borderTopColor: "var(--accent-lime)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
            Verificando enlace de invitación...
          </p>
        </div>
      )}

      {/* Token Verification Error State */}
      {!isVerifying && verificationError && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem" }}>⚠️</div>
          <div>
            <h2 style={{ fontSize: "1.125rem", color: "var(--danger)", marginBottom: "6px" }}>
              Enlace No Válido o Expirado
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              El enlace de activación ya fue utilizado o venció. Por favor, pedile a tu entrenador que te envíe un nuevo enlace desde GymApp.
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
              Crea tu contraseña para activar tu cuenta (<strong>{verificationData.email}</strong>).
            </p>
          </div>

          <Input
            label="Nueva Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caract. (mayús, núm, símb)"
            autoComplete="new-password"
            required
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            required
          />

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
            disabled={isSubmitting}
            style={{ height: "48px", fontSize: "1rem", fontWeight: 700, marginTop: "4px" }}
          >
            {isSubmitting ? "Activando cuenta..." : "Activar y Comenzar 💪"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            style={{ height: "40px", fontSize: "0.8125rem" }}
            onClick={onCancel}
          >
            Ya tengo contraseña / Iniciar sesión
          </Button>
        </form>
      )}
    </div>
  );
};
