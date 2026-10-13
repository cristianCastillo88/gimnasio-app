import React, { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { authApi } from "../../api/apiClient";

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"TRAINER" | "STUDENT">("TRAINER");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail("");
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setSuccessMessage(
        res.message ||
          "Si el correo ingresado corresponde a una cuenta registrada, recibirás un enlace seguro para restablecer tu contraseña."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la solicitud.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 130,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 32px)",
          maxWidth: "460px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          zIndex: 140,
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.8)",
          animation: "scaleIn 0.2s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>🔑</span>
            <h3
              id="forgot-password-title"
              style={{ fontSize: "1.1875rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}
            >
              Recuperar Contraseña
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.375rem",
              cursor: "pointer",
              padding: "8px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-surface-elevated)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("TRAINER");
              setError(null);
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "var(--radius-sm)",
              backgroundColor: activeTab === "TRAINER" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "TRAINER" ? "var(--text-primary)" : "var(--text-muted)",
              border: activeTab === "TRAINER" ? "1px solid var(--border-default)" : "none",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            📋 Soy Entrenador
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("STUDENT");
              setError(null);
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "var(--radius-sm)",
              backgroundColor: activeTab === "STUDENT" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "STUDENT" ? "var(--text-primary)" : "var(--text-muted)",
              border: activeTab === "STUDENT" ? "1px solid var(--border-default)" : "none",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            👤 Soy Alumno
          </button>
        </div>

        {activeTab === "TRAINER" ? (
          <div>
            {successMessage ? (
              <div
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid var(--accent-lime)",
                  color: "var(--accent-lime)",
                  padding: "18px",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "2rem" }}>✉️</span>
                <p style={{ fontWeight: 700, margin: 0, fontSize: "0.9375rem" }}>
                  Solicitud procesada
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  {successMessage}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  style={{ marginTop: "8px", minHeight: "44px" }}
                  onClick={handleClose}
                >
                  Entendido
                </Button>
              </div>
            ) : (
              <form onSubmit={handleTrainerSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  Ingresa tu correo de entrenador registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>

                <Input
                  label="Correo Electrónico de Entrenador"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entrenador@gymapp.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                />

                {error && (
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
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    style={{ flex: 1, minHeight: "44px" }}
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    style={{ flex: 1.4, minHeight: "44px", fontWeight: 700 }}
                    disabled={isSubmitting || !email}
                  >
                    {isSubmitting ? "Enviando enlace..." : "Enviar Enlace ✉️"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderLeft: "4px solid var(--accent-cyan)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.25rem" }}>💬</span>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  Restablecimiento Asistido por Entrenador
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                Por motivos de seguridad, los alumnos no gestionan recuperación por correo electrónico.
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                Por favor, <strong>comunícate directamente con tu entrenador por WhatsApp</strong>. Desde su panel, tu entrenador generará un nuevo enlace de acceso para que crees tu contraseña inmediatamente.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              style={{ minHeight: "44px", fontWeight: 700 }}
              onClick={handleClose}
            >
              Regresar al Inicio de Sesión
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
