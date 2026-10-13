import Dexie, { type Table } from "dexie";
import type {
  ActiveRoutineResponse,
  ExerciseHistoryResponse,
  WorkoutSessionPayload
} from "../api/types";

export interface PendingSyncSession {
  idempotencyKey: string;
  payload: WorkoutSessionPayload;
  createdAt: number;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  lastError?: string;
}

export interface CachedExerciseHistory {
  exerciseId: string;
  history: ExerciseHistoryResponse;
  updatedAt: number;
}

export interface CachedActiveRoutine {
  id: string; // "current"
  routine: ActiveRoutineResponse;
  updatedAt: number;
}

export class GymDatabase extends Dexie {
  pendingSyncSessions!: Table<PendingSyncSession, string>;
  cachedHistories!: Table<CachedExerciseHistory, string>;
  cachedRoutine!: Table<CachedActiveRoutine, string>;

  constructor() {
    super("GymAppOfflineDB");

    this.version(1).stores({
      pendingSyncSessions: "idempotencyKey, syncStatus, createdAt",
      cachedHistories: "exerciseId, updatedAt",
      cachedRoutine: "id, updatedAt"
    });
  }

  // --- Manejo de Rutina Activa en Caché ---
  async saveActiveRoutine(routine: ActiveRoutineResponse): Promise<void> {
    await this.cachedRoutine.put({
      id: "current",
      routine,
      updatedAt: Date.now()
    });
  }

  async getCachedActiveRoutine(): Promise<ActiveRoutineResponse | null> {
    const record = await this.cachedRoutine.get("current");
    return record ? record.routine : null;
  }

  // --- Manejo de Historial de Ejercicios en Caché ---
  async saveExerciseHistory(exerciseId: string, history: ExerciseHistoryResponse): Promise<void> {
    await this.cachedHistories.put({
      exerciseId,
      history,
      updatedAt: Date.now()
    });
  }

  async getCachedExerciseHistory(exerciseId: string): Promise<ExerciseHistoryResponse | null> {
    const record = await this.cachedHistories.get(exerciseId);
    return record ? record.history : null;
  }

  // --- Cola de Sesiones Pendientes de Sincronización ---
  async enqueueWorkoutSession(payload: WorkoutSessionPayload): Promise<void> {
    await this.pendingSyncSessions.put({
      idempotencyKey: payload.idempotencyKey,
      payload,
      createdAt: Date.now(),
      syncStatus: "PENDING"
    });
  }

  async getPendingSessions(): Promise<PendingSyncSession[]> {
    return this.pendingSyncSessions
      .where("syncStatus")
      .equals("PENDING")
      .toArray();
  }

  async markAsSynced(idempotencyKey: string): Promise<void> {
    await this.pendingSyncSessions.update(idempotencyKey, {
      syncStatus: "SYNCED",
      lastError: undefined
    });
  }

  async markAsFailed(idempotencyKey: string, error: string): Promise<void> {
    await this.pendingSyncSessions.update(idempotencyKey, {
      syncStatus: "FAILED",
      lastError: error
    });
  }

  async clearSyncedSessions(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const threshold = Date.now() - olderThanMs;
    await this.pendingSyncSessions
      .where("syncStatus")
      .equals("SYNCED")
      .and(session => session.createdAt < threshold)
      .delete();
  }
}

export const gymDb = new GymDatabase();
