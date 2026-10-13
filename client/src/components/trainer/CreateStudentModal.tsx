import React, { useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { trainerApi } from "../../api/apiClient";
import type { CreateStudentRequest, StudentSummary } from "../../api/types";

export interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated: () => void;
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentCreated,
}) => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState<string>("");
  const [sessionsRemaining, setSessionsRemaining] = useState<number>(8);
  const [medicalNotes, setMedicalNotes] = useState<string>("");
  const [fitnessGoals, setFitnessGoals] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del alumno recién creado para mostrar pantalla de enlace / WhatsApp
  const [createdStudent, setCreatedStudent] = useState<StudentSummary | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhoneWhatsapp("");
    setSessionsRemaining(8);
    setMedicalNotes("");
    setFitnessGoals("");
    setError(null);
    setCreatedStudent(null);
    setCopied(false);
  };

  const handleModalClose = () => {
    if (createdStudent) {
      onStudentCreated();
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phoneWhatsapp) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateStudentRequest = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneWhatsapp: phoneWhatsapp.trim(),
        sessionsRemaining,
        medicalNotes: medicalNotes.trim() || undefined,
        fitnessGoals: fitnessGoals.trim() || undefined,
      };

      const result = await trainerApi.createStudent(payload);
      setCreatedStudent(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear el alumno";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enlace y mensaje de WhatsApp para el alumno recién creado
  const activationLink = createdStudent?.activationToken
    ? `${window.location.origin}/?activateToken=${createdStudent.activationToken}`
    : `${window.location.origin}/`;

  const cleanPhone = createdStudent?.phoneWhatsapp?.replace(/\D/g, "") || "";
  const whatsappMsg = createdStudent
    ? `¡Hola ${createdStudent.fullName}! Te doy la bienvenida a GymApp 💪. Accedé a este enlace para crear tu contraseña personal y ver tu plan de entrenamiento:\n\n${activationLink}`
    : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div
        onClick={handleModalClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 110,
        }}
      />

      <div
        role="dialog"
        aria-label={createdStudent ? "Invitación de activación de alumno" : "Dar de alta a nuevo alumno"}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "480px",
          margin: "0 auto",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          padding: "20px 20px calc(var(--safe-bottom) + 20px) 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          zIndex: 120,
          maxHeight: "88dvh",
          overflowY: "auto",
        }}
      >
        {createdStudent ? (
          // Vista de éxito con opciones de compartir WhatsApp y Copiar enlace
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-lime-dim)",
                border: "2px solid var(--accent-lime)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                margin: "0 auto",
              }}
            >
              ✅
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase" }}>
                ¡Alumno Registrado!
              </span>
              <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
                {createdStudent.fullName}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Comparte el enlace de activación para que configure su contraseña personal y acceda a su rutina.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Enlace Personal de Activación
              </span>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-base)",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  wordBreak: "break-all",
                  border: "1px solid var(--border-default)",
                }}
              >
                {activationLink}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  height: "48px",
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
                }}
              >
                <span>📲</span>
                <span>Enviar por WhatsApp</span>
              </a>

              <Button
                type="button"
                variant="outline"
                style={{ height: "44px" }}
                onClick={handleCopyLink}
              >
                {copied ? "✓ ¡Enlace Copiado al Portapapeles!" : "📋 Copiar Enlace"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                style={{ height: "40px", marginTop: "4px" }}
                onClick={handleModalClose}
              >
                Listo / Finalizar
              </Button>
            </div>
          </div>
        ) : (
          // Formulario de creación
          <>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase" }}>
                Nuevo Registro
              </span>
              <h2 style={{ fontSize: "var(--font-title-fluid, 1.25rem)", color: "var(--text-primary)", marginTop: "2px" }}>
                Dar de Alta a un Alumno
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Input
                label="Nombre Completo *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Martín Pérez"
                required
              />

              <Input
                label="Correo Electrónico *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="martin@email.com"
                autoCapitalize="none"
                required
              />

              <Input
                label="Teléfono WhatsApp *"
                type="tel"
                value={phoneWhatsapp}
                onChange={(e) => setPhoneWhatsapp(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                required
              />

              <Input
                label="Clases Iniciales"
                type="number"
                value={sessionsRemaining}
                onChange={(e) => setSessionsRemaining(parseInt(e.target.value, 10) || 0)}
                stepper={{
                  step: 4,
                  onStep: (delta) => setSessionsRemaining((prev) => Math.max(0, prev + delta)),
                }}
              />

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Objetivos de Entrenamiento
                </label>
                <input
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  placeholder="Ej. Hipertrofia, recomposición corporal"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Notas Médicas / Lesiones
                </label>
                <input
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="Ej. Molestia lumbar leve, sin patologías"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 12px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {error ? (
                <div style={{ color: "var(--danger)", fontSize: "0.8125rem" }}>
                  ⚠️ {error}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <Button
                  type="button"
                  variant="ghost"
                  style={{ flex: 1 }}
                  onClick={handleModalClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ flex: 1.5 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Crear Alumno"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
};
