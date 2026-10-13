import React, { useState } from "react";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { NetworkStatusBadge } from "../components/common/NetworkStatusBadge";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { ChangePasswordModal } from "../components/common/ChangePasswordModal";
import { WhatsAppFloatingButton } from "../components/workout/WhatsAppFloatingButton";
import { useActiveWorkoutSession } from "../hooks/useActiveWorkoutSession";
import { useOfflineSync } from "../hooks/useOfflineSync";

export interface StudentDashboardPageProps {
  onStartWorkout: (dayId: string) => void;
  onLogout: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onStartWorkout,
  onLogout,
}) => {
  const { routine, selectedDay, selectDay } = useActiveWorkoutSession();
  const { pendingCount, isSyncing, syncPendingSessions } = useOfflineSync();

  const [activeTabDayId, setActiveTabDayId] = useState<string | null>(() => {
    return selectedDay?.id || routine?.days[0]?.id || null;
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  const currentDay = routine?.days.find((d) => d.id === (activeTabDayId || routine.days[0]?.id)) || routine?.days[0];

  const handleDaySelect = (dayId: string) => {
    setActiveTabDayId(dayId);
    selectDay(dayId);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "16px",
        paddingTop: "calc(var(--safe-top) + 16px)",
        paddingBottom: "calc(var(--safe-bottom) + 90px)",
        gap: "18px",
        maxWidth: "480px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              minWidth: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-lime-dim)",
              border: "1px solid var(--accent-lime)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.125rem",
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
              Panel del Alumno
            </span>
            <h1
              style={{
                fontSize: "var(--font-title-fluid, 1.125rem)",
                margin: 0,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Bienvenido de nuevo
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <NetworkStatusBadge />
          <ThemeToggle style={{ width: "36px", height: "36px", fontSize: "1rem" }} />
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            title="Cambiar contraseña"
            aria-label="Cambiar contraseña"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
              fontSize: "0.9375rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔒
          </button>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Subscription & Class Balance Card */}
      <section
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Estado de Suscripción
          </span>
          <Badge label="Cuota al Día" variant="success" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-hero-fluid, 2rem)",
              fontWeight: 800,
              color: "var(--accent-lime)",
            }}
          >
            8
          </span>
          <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            clases restantes este mes
          </span>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Gestionado directamente con tu entrenador. Sin renovaciones automáticas.
        </p>
      </section>

      {/* Pending Sync Sessions Banner (if any) */}
      {pendingCount > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            backgroundColor: "var(--warning-dim)",
            border: "1px solid var(--warning)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--warning)" }}>
              ⚡ {pendingCount} {pendingCount === 1 ? "sesión pendiente" : "sesiones pendientes"}
            </span>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Guardada localmente en IndexedDB.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            style={{ flexShrink: 0 }}
            disabled={isSyncing}
            onClick={() => void syncPendingSessions()}
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      ) : null}

      {/* Routine Days Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-lime)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Rutina Activa Asignada
          </span>
          <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginTop: "2px" }}>
            {routine?.title || "Rutina de Entrenamiento"}
          </h2>
        </div>

        {/* Day Selector Tabs */}
        {routine && routine.days.length > 0 ? (
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {routine.days.map((day) => {
              const isSelected = (currentDay?.id || routine.days[0].id) === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleDaySelect(day.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "var(--accent-lime)" : "var(--bg-surface-elevated)",
                    color: isSelected ? "var(--text-inverse)" : "var(--text-secondary)",
                    border: `1px solid ${isSelected ? "var(--accent-lime)" : "var(--border-default)"}`,
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {day.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Selected Day Exercise Preview Card */}
        {currentDay ? (
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                {currentDay.name}
              </h3>
              <Badge label={`${currentDay.exercises.length} Ejercicios`} variant="lime" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {currentDay.exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-surface-elevated)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-lime)", flexShrink: 0 }}>
                    {ex.targetSets} × {ex.targetReps}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Floating Bottom Action Bar (Thumb Zone) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "480px",
          margin: "0 auto",
          padding: "14px 16px calc(var(--safe-bottom) + 14px) 16px",
          backgroundColor: "rgba(9, 9, 11, 0.94)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border-default)",
          zIndex: 60,
        }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!currentDay}
          onClick={() => {
            if (currentDay) {
              onStartWorkout(currentDay.id);
            }
          }}
        >
          ▶ Iniciar {currentDay?.name || "Entrenamiento"}
        </Button>
      </div>

      {/* WhatsApp Support Button */}
      <WhatsAppFloatingButton />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
