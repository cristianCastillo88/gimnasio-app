import React, { useState, useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { WorkoutSessionPage } from "./pages/WorkoutSessionPage";
import { TrainerDashboardPage } from "./pages/TrainerDashboardPage";
import { ActivateAccountPage } from "./pages/ActivateAccountPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { getAuthToken, clearAuthToken, getUserProfile } from "./api/apiClient";
import { gymDb } from "./db/gymDatabase";
import type { ActiveRoutineResponse, UserProfile } from "./api/types";

// Rutina demo sembrada para preview local offline inmediata
const DEMO_ROUTINE: ActiveRoutineResponse = {
  id: "routine-demo-1",
  title: "Hipertrofia Funcional - 4 Días",
  description: "Enfoque en progresión de cargas y fuerza de empuje.",
  days: [
    {
      id: "day-torso-a",
      name: "Día A: Torso y Brazos",
      orderIndex: 1,
      exercises: [
        {
          id: "rex-1",
          exerciseId: "ex-1",
          name: "Press de Banca Plano con Barra",
          muscleGroup: "Pecho / Empuje",
          targetSets: 3,
          targetReps: "8-10",
          suggestedWeightKg: 75,
          suggestedRestSeconds: 90,
          videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
          executionTips: "Retracción escapular activa, trayectoria en diagonal hacia el esternón.",
          previousSession: {
            date: new Date(Date.now() - 7 * 86400000).toISOString(),
            sets: [
              { setNumber: 1, weightKg: 72.5, reps: 10 },
              { setNumber: 2, weightKg: 72.5, reps: 9 },
              { setNumber: 3, weightKg: 72.5, reps: 8 },
            ],
          },
        },
        {
          id: "rex-2",
          exerciseId: "ex-2",
          name: "Press Militar con Mancuernas",
          muscleGroup: "Hombros",
          targetSets: 3,
          targetReps: "10-12",
          suggestedWeightKg: 20,
          suggestedRestSeconds: 75,
          executionTips: "Codos a 45 grados respecto al torso. No arquear zona lumbar.",
          previousSession: {
            date: new Date(Date.now() - 7 * 86400000).toISOString(),
            sets: [
              { setNumber: 1, weightKg: 18, reps: 12 },
              { setNumber: 2, weightKg: 20, reps: 10 },
              { setNumber: 3, weightKg: 20, reps: 10 },
            ],
          },
        },
      ],
    },
    {
      id: "day-piernas-b",
      name: "Día B: Piernas y Glúteos",
      orderIndex: 2,
      exercises: [
        {
          id: "rex-3",
          exerciseId: "ex-3",
          name: "Sentadilla Trasera con Barra",
          muscleGroup: "Piernas / Cuádriceps",
          targetSets: 4,
          targetReps: "6-8",
          suggestedWeightKg: 90,
          suggestedRestSeconds: 120,
          executionTips: "Profundidad paralela, rodillas alineadas con la punta de los pies.",
          previousSession: {
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            sets: [
              { setNumber: 1, weightKg: 85, reps: 8 },
              { setNumber: 2, weightKg: 90, reps: 7 },
              { setNumber: 3, weightKg: 90, reps: 6 },
              { setNumber: 4, weightKg: 90, reps: 6 },
            ],
          },
        },
      ],
    },
  ],
};

type AppView = "LOGIN" | "DASHBOARD" | "WORKOUT" | "ACTIVATE" | "RESET_PASSWORD";

export const App: React.FC = () => {
  const [activateToken, setActivateToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("activateToken");
  });

  const [resetToken, setResetToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("resetToken");
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("activateToken")) return "ACTIVATE";
      if (params.get("resetToken")) return "RESET_PASSWORD";
    }
    return getAuthToken() ? "DASHBOARD" : "LOGIN";
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    return getUserProfile();
  });
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // Sembrar rutina demo en Dexie.js si está vacío para permitir prueba offline
  useEffect(() => {
    const seedOfflineData = async () => {
      const cached = await gymDb.getCachedActiveRoutine();
      if (!cached) {
        await gymDb.saveActiveRoutine(DEMO_ROUTINE);
      }
    };
    void seedOfflineData();
  }, []);

  const handleLoginSuccess = () => {
    const profile = getUserProfile();
    setUserProfile(profile);
    setCurrentView("DASHBOARD");
  };

  const handleActivationSuccess = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("activateToken");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
    setActivateToken(null);
    const profile = getUserProfile();
    setUserProfile(profile);
    setCurrentView("DASHBOARD");
  };

  const handleCancelActivation = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("activateToken");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
    setActivateToken(null);
    setCurrentView("LOGIN");
  };

  const handleResetSuccess = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("resetToken");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
    setResetToken(null);
    const profile = getUserProfile();
    setUserProfile(profile);
    setCurrentView("DASHBOARD");
  };

  const handleCancelReset = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("resetToken");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
    setResetToken(null);
    setCurrentView("LOGIN");
  };

  const handleContinueOffline = () => {
    setCurrentView("DASHBOARD");
  };

  const handleStartWorkout = (dayId: string) => {
    setActiveDayId(dayId);
    setCurrentView("WORKOUT");
  };

  const handleBackToDashboard = () => {
    setCurrentView("DASHBOARD");
  };

  const handleLogout = () => {
    clearAuthToken();
    setUserProfile(null);
    setCurrentView("LOGIN");
  };

  if (currentView === "ACTIVATE" && activateToken) {
    return (
      <ActivateAccountPage
        token={activateToken}
        onActivationSuccess={handleActivationSuccess}
        onCancel={handleCancelActivation}
      />
    );
  }

  if (currentView === "RESET_PASSWORD" && resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onResetSuccess={handleResetSuccess}
        onCancel={handleCancelReset}
      />
    );
  }

  if (currentView === "LOGIN") {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onContinueOffline={handleContinueOffline}
      />
    );
  }

  if (currentView === "WORKOUT" && activeDayId) {
    return (
      <WorkoutSessionPage
        dayId={activeDayId}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  // Si el usuario autenticado es Entrenador, mostrar Trainer Hub
  if (userProfile?.role === "TRAINER") {
    return <TrainerDashboardPage onLogout={handleLogout} />;
  }

  // De lo contrario, mostrar panel de Alumno
  return (
    <StudentDashboardPage
      onStartWorkout={handleStartWorkout}
      onLogout={handleLogout}
    />
  );
};

export default App;
