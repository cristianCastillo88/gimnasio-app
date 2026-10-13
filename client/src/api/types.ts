import type { components } from "./schema";

// Entidades y DTOs principales extraídos directamente del contrato OpenAPI 3.1
export type Schemas = components["schemas"];

export type UserProfile = Schemas["UserProfile"];
export type LoginRequest = Schemas["LoginRequest"];
export type AuthResponse = Schemas["AuthResponse"];
export type VerifyActivationTokenResponse = Schemas["VerifyActivationTokenResponse"];
export type ActivateAccountRequest = Schemas["ActivateAccountRequest"];
export type RegenerateActivationTokenResponse = Schemas["RegenerateActivationTokenResponse"];
export type ChangePasswordRequest = Schemas["ChangePasswordRequest"];
export type ForgotPasswordRequest = Schemas["ForgotPasswordRequest"];
export type ForgotPasswordResponse = Schemas["ForgotPasswordResponse"];
export type VerifyResetTokenResponse = Schemas["VerifyResetTokenResponse"];
export type ResetPasswordRequest = Schemas["ResetPasswordRequest"];

export type Exercise = Schemas["Exercise"];
export type CreateExerciseRequest = Schemas["CreateExerciseRequest"];
export type UpdateExerciseRequest = Schemas["UpdateExerciseRequest"];
export type ExerciseHistoryResponse = Schemas["ExerciseHistoryResponse"];
export type PreviousExercisePerformance = Schemas["PreviousExercisePerformance"];
export type SetPerformance = Schemas["SetPerformance"];

export type ActiveRoutineResponse = Schemas["ActiveRoutineResponse"];
export type RoutineDayDetail = Schemas["RoutineDayDetail"];
export type RoutineExerciseDetail = Schemas["RoutineExerciseDetail"];

export type WorkoutSessionPayload = Schemas["WorkoutSessionPayload"];
export type WorkoutSetLogPayload = Schemas["WorkoutSetLogPayload"];
export type SyncWorkoutBatchRequest = Schemas["SyncWorkoutBatchRequest"];
export type SyncWorkoutBatchResponse = Schemas["SyncWorkoutBatchResponse"];

export type StudentSummary = Schemas["StudentSummary"];
export type CreateStudentRequest = Schemas["CreateStudentRequest"];
export type UpdateSubscriptionRequest = Schemas["UpdateSubscriptionRequest"];

export type CreateRoutineExerciseRequest = Schemas["CreateRoutineExerciseRequest"];
export type CreateRoutineDayRequest = Schemas["CreateRoutineDayRequest"];
export type CreateRoutineTemplateRequest = Schemas["CreateRoutineTemplateRequest"];
export type UpdateRoutineTemplateRequest = Schemas["UpdateRoutineTemplateRequest"];
export type RoutineTemplateSummary = Schemas["RoutineTemplateSummary"];
export type AssignRoutineRequest = Schemas["AssignRoutineRequest"];
export type AssignRoutineResponse = Schemas["AssignRoutineResponse"];


export type StudentWorkoutHistoryResponse = Schemas["StudentWorkoutHistoryResponse"];
export type TrainerWorkoutSessionDetail = Schemas["TrainerWorkoutSessionDetail"];
export type TrainerWorkoutLogDetail = Schemas["TrainerWorkoutLogDetail"];

// Estructura estándar RFC 9457 para respuestas de error de la API
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

