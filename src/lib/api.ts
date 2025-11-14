import type {
  AuthenticatedUser,
  AuthResponse,
  BookingRequest,
  BookingRequestFilters,
  BookingRequestPayload,
  DormGalleryImage,
  DormRequestBody,
  DormRoom,
  DormRoomRequestBody,
  LoginBody,
  OwnerDorm,
  OwnerRegisterBody,
  RegisterBody,
  TokenLoginResponse,
  SeekerProfileCompletionBody,
  OwnerProfileCompletionBody,
  ProfileCompletionResponse,
} from "./types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8001";
export const PROFILES_API_URL = import.meta.env.VITE_PROFILES_API_URL ?? "http://localhost:8004";
export const DORMS_API_URL = import.meta.env.VITE_DORMS_API_URL ?? "http://localhost:8002";
export const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL ?? "http://localhost:8003";
export const MEDIA_API_URL = import.meta.env.VITE_MEDIA_API_URL ?? "http://localhost:8005";
export const NOTIFICATIONS_API_URL =
  import.meta.env.VITE_NOTIFICATIONS_API_URL ?? "http://localhost:8006";
export const CORE_API_URL = import.meta.env.VITE_CORE_API_URL ?? "http://localhost:8007";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const MEDIA_API_BASE = MEDIA_API_URL.replace(/\/+$/, "");

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return undefined;
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const absolute = new URL(trimmed);
      if (absolute.pathname.startsWith("/media/")) {
        return `${MEDIA_API_BASE}${absolute.pathname}${absolute.search}${absolute.hash}`;
      }
    } catch (error) {
      return trimmed;
    }

    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${MEDIA_API_BASE}${trimmed}`;
  }

  return `${MEDIA_API_BASE}/${trimmed}`;
}

export class ApiError extends Error {
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

function buildQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  if (!params) return "";

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return query ? `?${query}` : "";
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function api<T>(path: string, init?: RequestInit, baseUrl: string = API_URL): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    ...(isFormDataBody(init?.body) ? {} : { "Content-Type": "application/json" }),
    ...(init?.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    headers,
    credentials: "omit",
    ...init,
  });

  const text = await res.text();

  if (!res.ok) {
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

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return text as unknown as T;
  }
}

export async function register(body: RegisterBody) {
  return api<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
  }, AUTH_API_URL);
}

export async function registerOwner(body: OwnerRegisterBody) {
  return api<AuthResponse>("/auth/register-owner/", {
    method: "POST",
    body: JSON.stringify(body),
  }, AUTH_API_URL);
}

export async function login(body: LoginBody) {
  return api<TokenLoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(body),
  }, AUTH_API_URL);
}

export async function completeProfile(
  body: SeekerProfileCompletionBody | OwnerProfileCompletionBody,
): Promise<ProfileCompletionResponse> {
  return api<ProfileCompletionResponse>("/profiles/complete/", {
    method: "POST",
    body: JSON.stringify(body),
  }, PROFILES_API_URL);
}

export async function getMe() {
  return api<AuthenticatedUser>("/profiles/me/", undefined, PROFILES_API_URL);
}

export async function updateProfile(body: Partial<SeekerProfileCompletionBody> | Partial<OwnerProfileCompletionBody>) {
  return api<AuthenticatedUser>("/profiles/complete/", {
    method: "POST",
    body: JSON.stringify(body),
  }, PROFILES_API_URL);
}

export async function getOwnerDorms(params?: Record<string, string | number | boolean | null | undefined>) {
  const query = buildQuery(params);
  return api<OwnerDorm[]>(`/dorms/owner/dorms/${query}`, undefined, DORMS_API_URL);
}

function serializeDormPayload(payload: DormRequestBody) {
  if (payload.cover_photo instanceof File) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("property", String(payload.property));
    if (payload.description) {
      formData.append("description", payload.description);
    }
    formData.append("amenities", JSON.stringify(payload.amenities));
    formData.append("has_room_service", String(payload.has_room_service));
    formData.append("has_electricity", String(payload.has_electricity));
    formData.append("has_water", String(payload.has_water));
    formData.append("has_internet", String(payload.has_internet));
    formData.append("is_active", String(payload.is_active));
    formData.append("cover_photo", payload.cover_photo);
    return formData;
  }

  const { cover_photo, ...rest } = payload;
  return JSON.stringify(rest);
}

export async function createOwnerDorm(payload: DormRequestBody) {
  const body = serializeDormPayload(payload);
  return api<OwnerDorm>("/dorms/owner/dorms/", {
    method: "POST",
    body,
  }, DORMS_API_URL);
}

export async function updateOwnerDorm(id: number, payload: Partial<DormRequestBody> & { cover_photo?: File | null }) {
  const shouldUseFormData = payload.cover_photo instanceof File;
  let body: BodyInit;

  if (shouldUseFormData) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "amenities" && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      if (typeof value === "boolean") {
        formData.append(key, String(value));
        return;
      }
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    body = formData;
  } else {
    const normalized = { ...payload };
    if (normalized.cover_photo === null) {
      delete normalized.cover_photo;
    }
    body = JSON.stringify(normalized);
  }

  return api<OwnerDorm>(`/dorms/owner/dorms/${id}/`, {
    method: "PATCH",
    body,
  }, DORMS_API_URL);
}

export async function deleteOwnerDorm(id: number) {
  return api<void>(`/dorms/owner/dorms/${id}/`, {
    method: "DELETE",
  }, DORMS_API_URL);
}

export async function createDormImage(payload: { dorm: number; image: File; caption?: string }) {
  const formData = new FormData();
  formData.append("dorm", String(payload.dorm));
  formData.append("image", payload.image);
  if (payload.caption) {
    formData.append("caption", payload.caption);
  }
  return api<DormGalleryImage>("/media/owner/dorm-images/", {
    method: "POST",
    body: formData,
  }, MEDIA_API_URL);
}

export async function deleteDormImage(id: number) {
  return api<void>(`/media/owner/dorm-images/${id}/`, {
    method: "DELETE",
  }, MEDIA_API_URL);
}

export async function createDormRoomImage(payload: { room: number; image: File; caption?: string }) {
  const formData = new FormData();
  formData.append("room", String(payload.room));
  formData.append("image", payload.image);
  if (payload.caption) {
    formData.append("caption", payload.caption);
  }
  return api<DormGalleryImage>("/media/owner/dorm-room-images/", {
    method: "POST",
    body: formData,
  }, MEDIA_API_URL);
}

export async function deleteDormRoomImage(id: number) {
  return api<void>(`/media/owner/dorm-room-images/${id}/`, {
    method: "DELETE",
  }, MEDIA_API_URL);
}

export async function createDormRoom(payload: DormRoomRequestBody) {
  return api<DormRoom>("/dorms/owner/dorm-rooms/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, DORMS_API_URL);
}

export async function updateDormRoom(id: number, payload: Partial<DormRoomRequestBody>) {
  return api<DormRoom>(`/dorms/owner/dorm-rooms/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, DORMS_API_URL);
}

export async function deleteDormRoom(id: number) {
  return api<void>(`/dorms/owner/dorm-rooms/${id}/`, {
    method: "DELETE",
  }, DORMS_API_URL);
}

export async function getOwnerBookingRequests(filters?: BookingRequestFilters) {
  const query = buildQuery(filters);
  return api<BookingRequest[]>(`/booking/owner/booking-requests/${query}`, undefined, BOOKING_API_URL);
}

export async function updateBookingRequest(id: number, payload: Partial<BookingRequestPayload> & { status?: BookingRequest["status"] }) {
  return api<BookingRequest>(`/booking/owner/booking-requests/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, BOOKING_API_URL);
}

export async function createBookingRequest(payload: BookingRequestPayload) {
  return api<BookingRequest>("/booking/owner/booking-requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, BOOKING_API_URL);
}

export async function getSeekerDorms(params?: Record<string, string | number | boolean | null | undefined>) {
  const query = buildQuery(params);
  return api<OwnerDorm[]>(`/dorms/seeker/dorms/${query}`, undefined, DORMS_API_URL);
}

export async function getSeekerBookingRequests(filters?: BookingRequestFilters) {
  const query = buildQuery(filters);
  return api<BookingRequest[]>(`/booking/seeker/booking-requests/${query}`, undefined, BOOKING_API_URL);
}

export async function createSeekerBookingRequest(payload: BookingRequestPayload) {
  return api<BookingRequest>("/booking/seeker/booking-requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, BOOKING_API_URL);
}