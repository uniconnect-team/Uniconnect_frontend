import type {
  AuthResponse,
  LoginBody,
  OwnerRegisterBody,
  RegisterBody,
  TokenLoginResponse,
  SeekerProfileCompletionBody,
  OwnerProfileCompletionBody,
  ProfileCompletionResponse,
  AuthenticatedUser,
  Property,
  PropertyImage,
  PropertyPayload,
  Room,
  RoomImage,
  RoomPayload,
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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const finalHeaders = new Headers(init?.headers);

  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: finalHeaders,
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

export async function getOwnerProperties() {
  return api<Property[]>("/api/v1/auth/owner/properties/");
}

export async function createOwnerProperty(body: PropertyPayload) {
  return api<Property>("/api/v1/auth/owner/properties/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateOwnerProperty(
  propertyId: number,
  body: (Partial<PropertyPayload> & { cover_image?: null }) | FormData,
) {
  const requestBody = body instanceof FormData ? body : JSON.stringify(body);
  return api<Property>(`/api/v1/auth/owner/properties/${propertyId}/`, {
    method: "PATCH",
    body: requestBody,
  });
}

export async function deleteOwnerProperty(propertyId: number) {
  return api<void>(`/api/v1/auth/owner/properties/${propertyId}/`, {
    method: "DELETE",
  });
}

export async function uploadPropertyCoverImage(propertyId: number, file: File) {
  const formData = new FormData();
  formData.append("cover_image", file);
  return api<Property>(`/api/v1/auth/owner/properties/${propertyId}/`, {
    method: "PATCH",
    body: formData,
  });
}

export async function uploadPropertyGalleryImage(propertyId: number, file: File, caption?: string) {
  const formData = new FormData();
  formData.append("property", String(propertyId));
  formData.append("image", file);
  if (caption) {
    formData.append("caption", caption);
  }
  return api<PropertyImage>("/api/v1/auth/owner/property-images/", {
    method: "POST",
    body: formData,
  });
}

export async function deletePropertyImage(imageId: number) {
  return api<void>(`/api/v1/auth/owner/property-images/${imageId}/`, {
    method: "DELETE",
  });
}

export async function createOwnerRoom(propertyId: number, body: RoomPayload) {
  return api<Room>(`/api/v1/auth/owner/properties/${propertyId}/rooms/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateOwnerRoom(propertyId: number, roomId: number, body: Partial<RoomPayload>) {
  return api<Room>(`/api/v1/auth/owner/properties/${propertyId}/rooms/${roomId}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteOwnerRoom(propertyId: number, roomId: number) {
  return api<void>(`/api/v1/auth/owner/properties/${propertyId}/rooms/${roomId}/`, {
    method: "DELETE",
  });
}

export async function uploadRoomImage(roomId: number, file: File, caption?: string) {
  const formData = new FormData();
  formData.append("room", String(roomId));
  formData.append("image", file);
  if (caption) {
    formData.append("caption", caption);
  }
  return api<RoomImage>("/api/v1/auth/owner/room-images/", {
    method: "POST",
    body: formData,
  });
}

export async function deleteRoomImage(imageId: number) {
  return api<void>(`/api/v1/auth/owner/room-images/${imageId}/`, {
    method: "DELETE",
  });
}