import type {
  AuthResponse,
  LoginRequest,
  ActiveRoutineResponse,
  ExerciseHistoryResponse,
  SyncWorkoutBatchRequest,
  SyncWorkoutBatchResponse,
  ProblemDetails,
  StudentSummary,
  CreateStudentRequest,
  UpdateSubscriptionRequest,
  Exercise,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  CreateRoutineTemplateRequest,
  UpdateRoutineTemplateRequest,
  RoutineTemplateSummary,
  AssignRoutineRequest,

  AssignRoutineResponse,
  StudentWorkoutHistoryResponse,
  UserProfile,
  VerifyActivationTokenResponse,
  ActivateAccountRequest,
  RegenerateActivationTokenResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
} from "./types";

export class ApiException extends Error {
  public readonly status: number;
  public readonly problemDetails?: ProblemDetails;

  constructor(status: number, message: string, problemDetails?: ProblemDetails) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

const TOKEN_KEY = "gymapp_auth_token";
const USER_KEY = "gymapp_user_profile";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getUserProfile = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUserProfile = (user: UserProfile | null): void => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const clearAuthToken = (): void => {
  setAuthToken(null);
  setUserProfile(null);
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let problemDetails: ProblemDetails | undefined;
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        problemDetails = await response.json();
        if (problemDetails?.detail) {
          errorMessage = problemDetails.detail;
        } else if (problemDetails?.title) {
          errorMessage = problemDetails.title;
        }
      }
    } catch {
      // Body is not JSON
    }

    throw new ApiException(response.status, errorMessage, problemDetails);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// Bounded Contexts
export const authApi = {
  login: async (req: LoginRequest): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(req),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    if (res.user) {
      setUserProfile(res.user);
    }
    return res;
  },
  logout: (): void => {
    clearAuthToken();
  },
  verifyActivationToken: (token: string): Promise<VerifyActivationTokenResponse> => {
    return request<VerifyActivationTokenResponse>(`/auth/verify-activation-token?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
  },
  activateAccount: async (req: ActivateAccountRequest): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/activate-account", {
      method: "POST",
      body: JSON.stringify(req),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    if (res.user) {
      setUserProfile(res.user);
    }
    return res;
  },
  changePassword: async (req: ChangePasswordRequest): Promise<{ message: string }> => {
    return request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  forgotPassword: async (req: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    return request<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  verifyResetToken: (token: string): Promise<VerifyResetTokenResponse> => {
    return request<VerifyResetTokenResponse>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
  },
  resetPassword: async (req: ResetPasswordRequest): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(req),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    if (res.user) {
      setUserProfile(res.user);
    }
    return res;
  },
};

export const studentApi = {
  getActiveRoutine: (): Promise<ActiveRoutineResponse> => {
    return request<ActiveRoutineResponse>("/students/me/routine", {
      method: "GET",
    });
  },
};

export const exercisesApi = {
  getHistory: (exerciseId: string): Promise<ExerciseHistoryResponse> => {
    return request<ExerciseHistoryResponse>(`/exercises/${exerciseId}/history`, {
      method: "GET",
    });
  },
};

export const workoutsApi = {
  syncBatch: (req: SyncWorkoutBatchRequest): Promise<SyncWorkoutBatchResponse> => {
    return request<SyncWorkoutBatchResponse>("/workouts/sync", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
};

export const trainerApi = {
  getStudents: (): Promise<StudentSummary[]> => {
    return request<StudentSummary[]>("/trainer/students", {
      method: "GET",
    });
  },
  createStudent: (req: CreateStudentRequest): Promise<StudentSummary> => {
    return request<StudentSummary>("/trainer/students", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  updateSubscription: (studentId: string, req: UpdateSubscriptionRequest): Promise<StudentSummary> => {
    return request<StudentSummary>(`/trainer/students/${studentId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify(req),
    });
  },
  regenerateActivationToken: (studentId: string): Promise<RegenerateActivationTokenResponse> => {
    return request<RegenerateActivationTokenResponse>(`/trainer/students/${studentId}/activation-token`, {
      method: "POST",
    });
  },
  resetStudentPasswordToken: (studentId: string): Promise<RegenerateActivationTokenResponse> => {
    return request<RegenerateActivationTokenResponse>(`/trainer/students/${studentId}/reset-password-token`, {
      method: "POST",
    });
  },
  getExercises: (): Promise<Exercise[]> => {
    return request<Exercise[]>("/trainer/exercises", {
      method: "GET",
    });
  },
  createExercise: (req: CreateExerciseRequest): Promise<Exercise> => {
    return request<Exercise>("/trainer/exercises", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  updateExercise: (id: string, req: UpdateExerciseRequest): Promise<Exercise> => {
    return request<Exercise>(`/trainer/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    });
  },
  createRoutineTemplate: (req: CreateRoutineTemplateRequest): Promise<ActiveRoutineResponse> => {
    return request<ActiveRoutineResponse>("/trainer/routines", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  getRoutines: (): Promise<RoutineTemplateSummary[]> => {
    return request<RoutineTemplateSummary[]>("/trainer/routines", {
      method: "GET",
    });
  },
  getRoutineById: (id: string): Promise<ActiveRoutineResponse> => {
    return request<ActiveRoutineResponse>(`/trainer/routines/${id}`, {
      method: "GET",
    });
  },
  updateRoutine: (id: string, req: UpdateRoutineTemplateRequest): Promise<ActiveRoutineResponse> => {
    return request<ActiveRoutineResponse>(`/trainer/routines/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    });
  },
  duplicateRoutine: (id: string): Promise<ActiveRoutineResponse> => {
    return request<ActiveRoutineResponse>(`/trainer/routines/${id}/duplicate`, {
      method: "POST",
    });
  },
  deleteRoutine: (id: string): Promise<void> => {
    return request<void>(`/trainer/routines/${id}`, {
      method: "DELETE",
    });
  },
  assignRoutine: (req: AssignRoutineRequest): Promise<AssignRoutineResponse> => {


    return request<AssignRoutineResponse>("/trainer/routines/assign", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },
  getStudentWorkouts: (studentId: string): Promise<StudentWorkoutHistoryResponse> => {
    return request<StudentWorkoutHistoryResponse>(`/trainer/students/${studentId}/workouts`, {
      method: "GET",
    });
  },
};
