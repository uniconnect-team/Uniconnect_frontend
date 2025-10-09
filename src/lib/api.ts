import type { LoginBody, RegisterBody, TokenLoginResponse } from "./types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "omit",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function register(body: RegisterBody) {
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

export async function login(body: LoginBody) {
  return api<TokenLoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
