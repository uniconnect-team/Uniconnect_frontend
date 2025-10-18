import type {
  LoginBody,
  RegisterBody,
  SeekerVerificationConfirmBody,
  SeekerVerificationConfirmResponse,
  SeekerVerificationRequestBody,
  SeekerVerificationResponse,
  TokenLoginResponse,
} from "./types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error { //for errors
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function deriveErrorMessage(data: unknown): string | null {  
  if (!data) return null;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    const detail = (data as Record<string, unknown>).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.join(" ");
    }

    const firstEntry = Object.values(data)[0];
    if (typeof firstEntry === "string") {
      return firstEntry;
    }
    if (Array.isArray(firstEntry)) {
      return firstEntry.filter((item): item is string => typeof item === "string").join(" ");
    }
  }

  return null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> { //making requests to backend
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "omit",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed: unknown;

    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch (error) {
      parsed = undefined;
    }

    let message = deriveErrorMessage(parsed) ?? text ?? `Request failed with status ${res.status}`;

    if (res.status === 400 || res.status === 401) {
      const normalized = message.toLowerCase();
      if (
        normalized.includes("credential") ||
        normalized.includes("not found") ||
        normalized.includes("invalid")
      ) {
        message = "We couldn't find an account with those details.";
      }
    }

    if (res.status === 409) {
      message = "An account with these details already exists. Try logging in instead.";
    }

    if (res.status >= 500) {
      message = "Something went wrong on our side. Please try again in a moment.";
    }

    throw new ApiError(message.trim(), res.status, parsed ?? text);
  }
  return res.json() as Promise<T>;
}

export async function register(body: RegisterBody) { //when a new user signs up
  return api<{
    id: number;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    role: RegisterBody["role"];
  }>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function requestSeekerVerification(body: SeekerVerificationRequestBody) {
  return api<SeekerVerificationResponse>("/api/v1/auth/student/verification/request/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function confirmSeekerVerification(body: SeekerVerificationConfirmBody) {
  return api<SeekerVerificationConfirmResponse>("/api/v1/auth/student/verification/confirm/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginBody) { //when a user logs in
  return api<TokenLoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
