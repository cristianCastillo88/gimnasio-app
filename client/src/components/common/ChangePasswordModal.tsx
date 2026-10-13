import React, { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { authApi } from "../../api/apiClient";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Criterios de complejidad OWASP 2025
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setError("Debes ingresar tu contraseña actual.");
      return;
    }

    if (!isFormValid) {
      setError("Por favor cumple con todos los requisitos de seguridad de la contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage(response.message || "Tu contraseña se actualizó correctamente.");
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la contraseña.";
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

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
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
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <h3 id="change-password-title" style={{ fontSize: "1.1875rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Cambiar Contraseña
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

        {successMessage ? (
          <div
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              border: "1px solid var(--accent-lime)",
              color: "var(--accent-lime)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "2rem" }}>✅</span>
            <p style={{ fontWeight: 700, margin: 0, fontSize: "1rem" }}>{successMessage}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
              Cerrando automáticamente...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Contraseña Actual */}
            <div style={{ position: "relative" }}>
              <Input
                label="Contraseña Actual"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu clave actual"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Ocultar contraseña" : "Ver contraseña"}
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
                {showCurrentPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Nueva Contraseña */}
            <div style={{ position: "relative" }}>
              <Input
                label="Nueva Contraseña"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
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
                {showNewPassword ? "🙈" : "👁️"}
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

            {/* Confirmar Nueva Contraseña */}
            <div style={{ position: "relative" }}>
              <Input
                label="Confirmar Nueva Contraseña"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
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

            {/* Mensaje de Error */}
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

            {/* Acciones */}
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
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
                style={{ flex: 1.3, minHeight: "44px", fontWeight: 700 }}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Guardando..." : "Actualizar Clave"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};
