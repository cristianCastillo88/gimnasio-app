import React, { useState } from "react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { NetworkStatusBadge } from "../components/common/NetworkStatusBadge";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { ForgotPasswordModal } from "../components/common/ForgotPasswordModal";
import { authApi } from "../api/apiClient";

export interface LoginPageProps {
  onLoginSuccess: () => void;
  onContinueOffline?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onContinueOffline,
}) => {
  const [email, setEmail] = useState<string>("alumno@gymapp.com");
  const [password, setPassword] = useState<string>("Alumno123!");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.login({ email, password });
      onLoginSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al autenticar credenciales";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
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
          ⚡
        </div>
        <h1 style={{ fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
          GymApp
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
          Entrenamiento guiado y seguimiento en sala de pesas
        </p>
      </div>

      {/* Login Card */}
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
        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          autoCapitalize="none"
          required
        />

        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              textDecoration: "underline",
              padding: "4px 0",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {errorMessage ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--danger-dim)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: "0.8125rem",
              lineHeight: 1.4,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión →"}
        </Button>
      </form>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Demo Credentials & Offline Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setEmail("alumno@gymapp.com");
            setPassword("Alumno123!");
            setErrorMessage(null);
          }}
          style={{
            fontSize: "0.8125rem",
            color: "var(--accent-lime)",
            fontWeight: 600,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          👤 Acceso Alumno Demo (alumno@gymapp.com / Alumno123!)
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail("trainer@gymapp.com");
            setPassword("Trainer123!");
            setErrorMessage(null);
          }}
          style={{
            fontSize: "0.8125rem",
            color: "var(--accent-cyan)",
            fontWeight: 600,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          📋 Acceso Entrenador Demo (trainer@gymapp.com / Trainer123!)
        </button>

        {onContinueOffline ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            style={{ marginTop: "4px" }}
            onClick={onContinueOffline}
          >
            Modo Sin Conexión (Acceso Local)
          </Button>
        ) : null}
      </div>
    </div>
  );
};
