import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { NetworkStatusBadge } from "../components/common/NetworkStatusBadge";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { ChangePasswordModal } from "../components/common/ChangePasswordModal";
import {
  StudentCard,
  CreateStudentModal,
  UpdateSubscriptionModal,
  CreateExerciseModal,
  EditExerciseModal,
  CreateRoutineModal,
  EditRoutineModal,
  AssignRoutineModal,
  StudentWorkoutHistoryModal,
} from "../components/trainer";
import { trainerApi } from "../api/apiClient";
import type { StudentSummary, Exercise, RoutineTemplateSummary } from "../api/types";

export interface TrainerDashboardPageProps {
  onLogout: () => void;
}

type TrainerTab = "STUDENTS" | "EXERCISES" | "ROUTINES";

export const TrainerDashboardPage: React.FC<TrainerDashboardPageProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TrainerTab>("STUDENTS");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<RoutineTemplateSummary[]>([]);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState<boolean>(false);
  const [isUpdateSubOpen, setIsUpdateSubOpen] = useState<boolean>(false);
  const [selectedStudentForSub, setSelectedStudentForSub] = useState<StudentSummary | null>(null);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState<boolean>(false);
  const [isEditExerciseOpen, setIsEditExerciseOpen] = useState<boolean>(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<Exercise | null>(null);
  const [isCreateRoutineOpen, setIsCreateRoutineOpen] = useState<boolean>(false);
  const [isEditRoutineOpen, setIsEditRoutineOpen] = useState<boolean>(false);
  const [selectedRoutineIdForEdit, setSelectedRoutineIdForEdit] = useState<string | null>(null);
  const [isAssignRoutineOpen, setIsAssignRoutineOpen] = useState<boolean>(false);
  const [selectedStudentForRoutine, setSelectedStudentForRoutine] = useState<StudentSummary | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentSummary | null>(null);


  // Success Feedback Toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState<string>("");
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>("TODOS");

  // Routine Deletion state
  const [routineToDelete, setRoutineToDelete] = useState<RoutineTemplateSummary | null>(null);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState<boolean>(false);

  const handleDuplicateRoutine = async (routineId: string) => {
    try {
      await trainerApi.duplicateRoutine(routineId);
      await fetchData();
      showSuccess("¡Rutina duplicada exitosamente!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al duplicar la plantilla";
      alert(message);
    }
  };

  const handleConfirmDeleteRoutine = async () => {
    if (!routineToDelete) return;
    setIsDeletingRoutine(true);
    try {
      await trainerApi.deleteRoutine(routineToDelete.id);
      const deletedTitle = routineToDelete.title;
      setRoutineToDelete(null);
      await fetchData();
      showSuccess(`Plantilla "${deletedTitle}" eliminada exitosamente.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar la plantilla";
      alert(message);
    } finally {
      setIsDeletingRoutine(false);
    }
  };


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsData, exercisesData, routinesData] = await Promise.all([
        trainerApi.getStudents().catch(() => []),
        trainerApi.getExercises().catch(() => []),
        trainerApi.getRoutines().catch(() => []),
      ]);
      setStudents(studentsData);
      setExercises(exercisesData);
      setRoutines(routinesData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Handlers for student card actions
  const handleAdjustSubscription = (student: StudentSummary) => {
    setSelectedStudentForSub(student);
    setIsUpdateSubOpen(true);
  };

  const handleAssignRoutine = (student: StudentSummary) => {
    setSelectedStudentForRoutine(student);
    setIsAssignRoutineOpen(true);
  };

  const handleViewHistory = (student: StudentSummary) => {
    setSelectedStudentForHistory(student);
    setIsHistoryOpen(true);
  };

  // Metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.subscriptionStatus === "ACTIVE").length;
  const expiredStudents = students.filter((s) => s.subscriptionStatus === "EXPIRED").length;

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
      (ex.movementPattern && ex.movementPattern.toLowerCase().includes(exerciseSearchTerm.toLowerCase()));
    const matchesMuscle =
      selectedMuscleFilter === "TODOS" || ex.muscleGroup.toLowerCase() === selectedMuscleFilter.toLowerCase();
    return matchesSearch && matchesMuscle;
  });


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "16px",
        paddingTop: "calc(var(--safe-top) + 16px)",
        paddingBottom: "calc(var(--safe-bottom) + 32px)",
        gap: "18px",
        maxWidth: "480px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Success Notification Banner */}
      {successMessage ? (
        <div
          role="status"
          style={{
            position: "sticky",
            top: "calc(var(--safe-top) + 8px)",
            zIndex: 100,
            backgroundColor: "var(--accent-lime)",
            color: "var(--text-inverse)",
            fontWeight: 700,
            fontSize: "0.875rem",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(132, 204, 22, 0.35)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{ fontWeight: 800, fontSize: "1rem", cursor: "pointer", color: "inherit", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Header Superior */}
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
            📋
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--accent-lime)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block" }}>
              Trainer Hub
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
              Panel de Control
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

      {/* Aggregate Metrics Hero Card */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 8px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Alumnos
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-stat-fluid, 1.375rem)", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
            {totalStudents}
          </p>
        </div>
        <div style={{ textAlign: "center", borderInline: "1px solid var(--border-default)" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--success)", textTransform: "uppercase" }}>
            Al Día
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-stat-fluid, 1.375rem)", fontWeight: 800, color: "var(--success)", marginTop: "2px" }}>
            {activeStudents}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--danger)", textTransform: "uppercase" }}>
            Vencidos
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-stat-fluid, 1.375rem)", fontWeight: 800, color: "var(--danger)", marginTop: "2px" }}>
            {expiredStudents}
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "6px", backgroundColor: "var(--bg-surface)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
        <button
          type="button"
          onClick={() => setActiveTab("STUDENTS")}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "var(--radius-sm)",
            backgroundColor: activeTab === "STUDENTS" ? "var(--bg-surface-elevated)" : "transparent",
            color: activeTab === "STUDENTS" ? "var(--accent-lime)" : "var(--text-secondary)",
            border: activeTab === "STUDENTS" ? "1px solid var(--border-default)" : "none",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Alumnos ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("EXERCISES")}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "var(--radius-sm)",
            backgroundColor: activeTab === "EXERCISES" ? "var(--bg-surface-elevated)" : "transparent",
            color: activeTab === "EXERCISES" ? "var(--accent-lime)" : "var(--text-secondary)",
            border: activeTab === "EXERCISES" ? "1px solid var(--border-default)" : "none",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Biblioteca ({exercises.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ROUTINES")}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: "var(--radius-sm)",
            backgroundColor: activeTab === "ROUTINES" ? "var(--bg-surface-elevated)" : "transparent",
            color: activeTab === "ROUTINES" ? "var(--accent-lime)" : "var(--text-secondary)",
            border: activeTab === "ROUTINES" ? "1px solid var(--border-default)" : "none",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Rutinas ({routines.length})
        </button>
      </div>

      {/* Tab Content: Alumnos */}
      {activeTab === "STUDENTS" ? (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar por nombre o email..."
              style={{
                flex: 1,
                height: "44px",
                padding: "0 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateStudentOpen(true)}
            >
              + Alumno
            </Button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
              Cargando alumnos...
            </p>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No se encontraron alumnos registrados.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onAdjustSubscription={handleAdjustSubscription}
                  onViewHistory={handleViewHistory}
                  onAssignRoutine={handleAssignRoutine}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Tab Content: Biblioteca de Ejercicios */}
      {activeTab === "EXERCISES" ? (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Ejercicios ({filteredExercises.length} de {exercises.length})
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateExerciseOpen(true)}
            >
              + Ejercicio
            </Button>
          </div>

          {/* Search bar & Muscle chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              value={exerciseSearchTerm}
              onChange={(e) => setExerciseSearchTerm(e.target.value)}
              placeholder="🔍 Buscar ejercicio por nombre o patrón..."
              style={{
                height: "44px",
                padding: "0 12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
              {["TODOS", "Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Core", "Glúteos"].map((muscle) => {
                const isSelected = selectedMuscleFilter === muscle;
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => setSelectedMuscleFilter(muscle)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: isSelected ? "var(--accent-lime)" : "var(--bg-surface-elevated)",
                      color: isSelected ? "var(--text-inverse)" : "var(--text-secondary)",
                      border: `1px solid ${isSelected ? "var(--accent-lime)" : "var(--border-default)"}`,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minHeight: "34px",
                    }}
                  >
                    {muscle}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredExercises.map((ex) => (

              <div
                key={ex.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ fontSize: "0.9375rem", color: "var(--text-primary)", margin: 0 }}>
                    {ex.name}
                  </h4>
                  {ex.movementPattern ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {ex.movementPattern}
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <Badge label={ex.muscleGroup} variant="muscle" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExerciseForEdit(ex);
                      setIsEditExerciseOpen(true);
                    }}
                    aria-label={`Editar ${ex.name}`}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      minHeight: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>
      ) : null}

      {/* Tab Content: Constructor de Rutinas */}
      {activeTab === "ROUTINES" ? (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Plantillas de Entrenamiento ({routines.length})
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateRoutineOpen(true)}
            >
              + Nueva Plantilla
            </Button>
          </div>

          {routines.length === 0 ? (
            <div style={{ padding: "28px 16px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-lg)", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                No tienes plantillas de entrenamiento creadas todavía.
              </p>
              <Button
                variant="secondary"
                size="md"
                style={{ marginTop: "14px" }}
                onClick={() => setIsCreateRoutineOpen(true)}
              >
                Crear Primera Plantilla
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {routines.map((routine) => (
                <article
                  key={routine.id}
                  className="list-item-optimized"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.0625rem", color: "var(--text-primary)", margin: 0 }}>
                        {routine.title}
                      </h3>
                      {routine.description ? (
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "3px" }}>
                          {routine.description}
                        </p>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                      <Badge
                        label={routine.activeStudentsCount > 0 ? `👥 ${routine.activeStudentsCount} alumnos` : "⚪ Sin alumnos"}
                        variant={routine.activeStudentsCount > 0 ? "success" : "neutral"}
                      />
                      <Badge label={`${routine.daysCount} Días`} variant="muscle" />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-subtle)",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        ⚡ {routine.exercisesCount} {routine.exercisesCount === 1 ? "ejercicio" : "ejercicios"} en total
                      </span>
                      <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {new Date(routine.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleDuplicateRoutine(routine.id)}
                        aria-label={`Duplicar rutina ${routine.title}`}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          minHeight: "36px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        📑 Duplicar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoutineIdForEdit(routine.id);
                          setIsEditRoutineOpen(true);
                        }}
                        aria-label={`Editar rutina ${routine.title}`}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-default)",
                          color: "var(--accent-lime)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          minHeight: "36px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoutineToDelete(routine)}
                        disabled={routine.activeStudentsCount > 0}
                        title={
                          routine.activeStudentsCount > 0
                            ? "No puedes eliminar una plantilla asignada a alumnos activos"
                            : "Eliminar plantilla de rutina"
                        }
                        aria-label={`Eliminar rutina ${routine.title}`}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-default)",
                          color: routine.activeStudentsCount > 0 ? "var(--text-muted)" : "var(--danger)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: routine.activeStudentsCount > 0 ? "not-allowed" : "pointer",
                          opacity: routine.activeStudentsCount > 0 ? 0.45 : 1,
                          minHeight: "36px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Modales del Entrenador */}
      <CreateStudentModal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        onStudentCreated={fetchData}
      />

      <UpdateSubscriptionModal
        isOpen={isUpdateSubOpen}
        student={selectedStudentForSub}
        onClose={() => {
          setIsUpdateSubOpen(false);
          setSelectedStudentForSub(null);
        }}
        onUpdateSuccess={fetchData}
      />

      <CreateExerciseModal
        isOpen={isCreateExerciseOpen}
        onClose={() => setIsCreateExerciseOpen(false)}
        onExerciseCreated={fetchData}
      />

      <EditExerciseModal
        isOpen={isEditExerciseOpen}
        exercise={selectedExerciseForEdit}
        onClose={() => {
          setIsEditExerciseOpen(false);
          setSelectedExerciseForEdit(null);
        }}
        onExerciseUpdated={() => {
          void fetchData();
          showSuccess("¡Ejercicio actualizado exitosamente!");
        }}
      />

      <CreateRoutineModal
        isOpen={isCreateRoutineOpen}
        exercises={exercises}
        onClose={() => setIsCreateRoutineOpen(false)}
        onRoutineCreated={() => {
          void fetchData();
          showSuccess("¡Plantilla de rutina guardada exitosamente!");
        }}
      />

      <EditRoutineModal
        isOpen={isEditRoutineOpen}
        routineId={selectedRoutineIdForEdit}
        exercises={exercises}
        onClose={() => {
          setIsEditRoutineOpen(false);
          setSelectedRoutineIdForEdit(null);
        }}
        onRoutineUpdated={() => {
          void fetchData();
          showSuccess("¡Rutina actualizada exitosamente!");
        }}
      />

      <AssignRoutineModal
        isOpen={isAssignRoutineOpen}
        student={selectedStudentForRoutine}
        routines={routines}
        onClose={() => {
          setIsAssignRoutineOpen(false);
          setSelectedStudentForRoutine(null);
        }}
        onAssignedSuccess={(routineTitle) => {
          void fetchData();
          showSuccess(`¡Rutina "${routineTitle}" asignada exitosamente a ${selectedStudentForRoutine?.fullName || "alumno"}!`);
        }}
      />

      <StudentWorkoutHistoryModal
        isOpen={isHistoryOpen}
        student={selectedStudentForHistory}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedStudentForHistory(null);
        }}
      />

      {/* Modal de Confirmación para Eliminar Rutina */}
      {routineToDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              maxWidth: "420px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--danger)" }}>
              🗑 Eliminar Plantilla de Rutina
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar la plantilla <strong>"{routineToDelete.title}"</strong>?
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Historial seguro:</strong> Esta rutina no tiene alumnos activos asignados. Las sesiones de entrenamiento que algún alumno haya registrado en el pasado con esta plantilla conservarán todos sus kilos, series y repeticiones intactos.
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <Button
                variant="ghost"
                style={{ flex: 1 }}
                onClick={() => setRoutineToDelete(null)}
                disabled={isDeletingRoutine}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                style={{
                  flex: 1.2,
                  backgroundColor: "var(--danger)",
                  borderColor: "var(--danger)",
                  color: "#ffffff",
                }}
                onClick={handleConfirmDeleteRoutine}
                disabled={isDeletingRoutine}
              >
                {isDeletingRoutine ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

