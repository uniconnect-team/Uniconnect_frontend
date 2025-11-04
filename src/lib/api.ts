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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    ...(isFormDataBody(init?.body) ? {} : { "Content-Type": "application/json" }),
    ...(init?.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
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
  return api<AuthResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function registerOwner(body: OwnerRegisterBody) {
  return api<AuthResponse>("/api/v1/auth/register-owner/", {
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

export async function completeProfile(body: SeekerProfileCompletionBody | OwnerProfileCompletionBody): Promise<ProfileCompletionResponse> {
  return api<ProfileCompletionResponse>("/api/v1/auth/complete-profile/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe() {
  return api<AuthenticatedUser>("/api/v1/auth/me/");
}

export async function updateProfile(body: Partial<SeekerProfileCompletionBody> | Partial<OwnerProfileCompletionBody>) {
  return api<AuthenticatedUser>("/api/v1/auth/update-profile/", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function getOwnerDorms(params?: Record<string, string | number | boolean | null | undefined>) {
  const query = buildQuery(params);
  return api<OwnerDorm[]>(`/api/users/owner/dorms/${query}`);
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
  return api<OwnerDorm>("/api/users/owner/dorms/", {
    method: "POST",
    body,
  });
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

  return api<OwnerDorm>(`/api/users/owner/dorms/${id}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteOwnerDorm(id: number) {
  return api<void>(`/api/users/owner/dorms/${id}/`, {
    method: "DELETE",
  });
}

export async function createDormImage(payload: { dorm: number; image: File; caption?: string }) {
  const formData = new FormData();
  formData.append("dorm", String(payload.dorm));
  formData.append("image", payload.image);
  if (payload.caption) {
    formData.append("caption", payload.caption);
  }
  return api<DormGalleryImage>("/api/users/owner/dorm-images/", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDormImage(id: number) {
  return api<void>(`/api/users/owner/dorm-images/${id}/`, {
    method: "DELETE",
  });
}

export async function createDormRoomImage(payload: { room: number; image: File; caption?: string }) {
  const formData = new FormData();
  formData.append("room", String(payload.room));
  formData.append("image", payload.image);
  if (payload.caption) {
    formData.append("caption", payload.caption);
  }
  return api<DormGalleryImage>("/api/users/owner/dorm-room-images/", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDormRoomImage(id: number) {
  return api<void>(`/api/users/owner/dorm-room-images/${id}/`, {
    method: "DELETE",
  });
}

export async function createDormRoom(payload: DormRoomRequestBody) {
  return api<DormRoom>("/api/users/owner/dorm-rooms/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDormRoom(id: number, payload: Partial<DormRoomRequestBody>) {
  return api<DormRoom>(`/api/users/owner/dorm-rooms/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteDormRoom(id: number) {
  return api<void>(`/api/users/owner/dorm-rooms/${id}/`, {
    method: "DELETE",
  });
}

export async function getOwnerBookingRequests(filters?: BookingRequestFilters) {
  const query = buildQuery(filters);
  return api<BookingRequest[]>(`/api/users/owner/booking-requests/${query}`);
}

export async function updateBookingRequest(id: number, payload: Partial<BookingRequestPayload> & { status?: BookingRequest["status"] }) {
  return api<BookingRequest>(`/api/users/owner/booking-requests/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createBookingRequest(payload: BookingRequestPayload) {
  return api<BookingRequest>("/api/users/owner/booking-requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}