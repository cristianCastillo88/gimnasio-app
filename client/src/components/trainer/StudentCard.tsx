import React, { useState } from "react";
import { Badge, type BadgeVariant } from "../common/Badge";
import { Button } from "../common/Button";
import { trainerApi } from "../../api/apiClient";
import type { StudentSummary } from "../../api/types";

export interface StudentCardProps {
  student: StudentSummary;
  onAdjustSubscription: (student: StudentSummary) => void;
  onViewHistory: (student: StudentSummary) => void;
  onAssignRoutine: (student: StudentSummary) => void;
  onStudentUpdated?: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onAdjustSubscription,
  onViewHistory,
  onAssignRoutine,
  onStudentUpdated,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetModalData, setResetModalData] = useState<{ link: string; waUrl: string | null } | null>(null);
  const [copiedResetLink, setCopiedResetLink] = useState<boolean>(false);

  const getBadgeVariant = (status: StudentSummary["subscriptionStatus"]): BadgeVariant => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "EXPIRED":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "neutral";
    }
  };

  const getStatusLabel = (status: StudentSummary["subscriptionStatus"]): string => {
    switch (status) {
      case "ACTIVE":
        return "Al Día";
      case "EXPIRED":
        return "Cuota Vencida";
      case "PENDING":
        return "Pago Pendiente";
      default:
        return status;
    }
  };

  const activationLink = student.activationToken
    ? `${window.location.origin}/?activateToken=${student.activationToken}`
    : null;

  // WhatsApp contextual pre-composed link
  const phoneClean = student.phoneWhatsapp?.replace(/[^0-9]/g, "") || "";
  const getWhatsAppMessage = (): string => {
    if (student.activationToken && activationLink) {
      return `¡Hola ${student.fullName}! Te doy la bienvenida a GymApp 💪. Accedé a este enlace para crear tu contraseña personal y ver tu plan de entrenamiento:\n\n${activationLink}`;
    }
    if (student.subscriptionStatus === "EXPIRED" || student.sessionsRemaining <= 0) {
      return `¡Hola ${student.fullName}! Te escribo de GymApp para comentarte que tu abono de clases se encuentra vencido. ¿Querés que coordinemos la renovación para seguir con tu plan de entrenamiento? 💪`;
    }
    if (student.assignedRoutineTitle) {
      return `¡Hola ${student.fullName}! ¿Cómo va todo? Te escribo de GymApp para ver cómo venís con la rutina "${student.assignedRoutineTitle}" y coordinar los entrenamientos de esta semana. 🏋️‍♂️`;
    }
    return `¡Hola ${student.fullName}! ¿Cómo estás? Te escribo desde GymApp para coordinar tus próximos entrenamientos de la semana.`;
  };

  const whatsappUrl = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(getWhatsAppMessage())}`
    : null;

  const handleCopyActivationLink = async () => {
    if (!activationLink) return;
    try {
      await navigator.clipboard.writeText(activationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleResetPassword = async () => {
    const confirmed = window.confirm(
      `¿Deseas generar un nuevo enlace para que ${student.fullName} restablezca su contraseña? El enlace anterior quedará invalidado.`
    );
    if (!confirmed) return;

    setIsResettingPassword(true);
    try {
      const res = await trainerApi.resetStudentPasswordToken(student.id);
      const link = `${window.location.origin}/?activateToken=${res.activationToken}`;
      const msg = `¡Hola ${student.fullName}! Aquí tienes tu enlace para restablecer tu contraseña en GymApp 💪:\n\n${link}`;
      const wa = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : null;

      setResetModalData({ link, waUrl: wa });
      if (onStudentUpdated) {
        onStudentUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar enlace de restablecimiento";
      alert(msg);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyResetLink = async () => {
    if (!resetModalData) return;
    try {
      await navigator.clipboard.writeText(resetModalData.link);
      setCopiedResetLink(true);
      setTimeout(() => setCopiedResetLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "16px",
      }}
    >
      {/* Student Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: "1.0625rem", color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {student.fullName}
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {student.email}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Badge
            label={getStatusLabel(student.subscriptionStatus)}
            variant={getBadgeVariant(student.subscriptionStatus)}
          />
        </div>
      </div>

      {/* Subscription & Routine Details */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Clases Restantes</span>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.125rem",
              fontWeight: 800,
              color: student.sessionsRemaining > 0 ? "var(--accent-lime)" : "var(--danger)",
              marginTop: "2px",
            }}
          >
            {student.sessionsRemaining} <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>clases</span>
          </p>
        </div>

        <div style={{ textAlign: "right", minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rutina Asignada</span>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {student.assignedRoutineTitle || "Sin asignar"}
          </p>
        </div>
      </div>

      {/* Activation Alert if token exists */}
      {student.activationToken ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(234, 179, 8, 0.08)",
            border: "1px solid rgba(234, 179, 8, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.875rem" }}>⏳</span>
            <span style={{ fontSize: "0.75rem", color: "var(--warning)", fontWeight: 600 }}>
              Pendiente de activación
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyActivationLink}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: copiedLink ? "var(--accent-lime)" : "var(--text-primary)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {copiedLink ? "✓ ¡Copiado!" : "📋 Copiar Enlace"}
          </button>
        </div>
      ) : null}

      {/* Reset Password Banner (if generated) */}
      {resetModalData ? (
        <div
          style={{
            backgroundColor: "rgba(132, 204, 22, 0.1)",
            border: "1px solid var(--accent-lime)",
            borderRadius: "var(--radius-md)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              🔑 Enlace de restablecimiento generado
            </span>
            <button
              type="button"
              onClick={() => setResetModalData(null)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, wordBreak: "break-all" }}>
            {resetModalData.link}
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            {resetModalData.waUrl ? (
              <a
                href={resetModalData.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "36px",
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                💬 Enviar WhatsApp
              </a>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              style={{ flex: 1, height: "36px", fontSize: "0.75rem" }}
              onClick={handleCopyResetLink}
            >
              {copiedResetLink ? "✓ ¡Copiado!" : "📋 Copiar"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "6px", marginTop: "2px" }}>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={
              student.subscriptionStatus === "EXPIRED" || student.sessionsRemaining <= 0
                ? "Enviar aviso de cuota vencida por WhatsApp"
                : "Enviar mensaje de seguimiento por WhatsApp"
            }
            aria-label="Contactar alumno por WhatsApp"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "0 8px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "#25D366",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            💬 WA
          </a>
        ) : null}

        <Button
          variant="secondary"
          size="sm"
          style={{ height: "40px", padding: "0 4px", fontSize: "0.75rem" }}
          onClick={() => onAdjustSubscription(student)}
        >
          ⚙ Cuota
        </Button>

        <Button
          variant="outline"
          size="sm"
          style={{ height: "40px", padding: "0 4px", fontSize: "0.75rem" }}
          onClick={() => onAssignRoutine(student)}
        >
          📋 Rutina
        </Button>

        <Button
          variant="outline"
          size="sm"
          style={{ height: "40px", padding: "0 4px", fontSize: "0.75rem" }}
          onClick={() => onViewHistory(student)}
        >
          📊 Progreso
        </Button>

        <Button
          variant="outline"
          size="sm"
          style={{ height: "40px", padding: "0 4px", fontSize: "0.75rem" }}
          onClick={handleResetPassword}
          disabled={isResettingPassword}
          title="Generar nuevo enlace de restablecimiento de contraseña para el alumno"
        >
          {isResettingPassword ? "..." : "🔑 Clave"}
        </Button>
      </div>
    </article>
  );
};
