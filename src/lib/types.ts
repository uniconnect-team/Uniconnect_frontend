export type Role = "SEEKER" | "OWNER" | "UNIVERSITY_STUDENT";

export type RegisterBody = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  university_email?: string;
  student_id?: string;
};

export type OwnerRegisterBody = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  properties: {
    name: string;
    location: string;
  }[];
};

export type LoginBody = {
  identifier: string;
  password: string;
  remember_me?: boolean;
};

export type PropertyImage = {
  id: number;
  image: string;
  caption?: string;
  uploaded_at: string;
};

export type RoomImage = {
  id: number;
  image: string;
  caption?: string;
  uploaded_at: string;
};

export type RoomType = "SINGLE" | "DOUBLE" | "SUITE" | "OTHER";

export type Room = {
  id: number;
  name: string;
  room_type: RoomType;
  description: string;
  property: number;
  price_per_month: string;
  capacity: number;
  available_quantity: number;
  amenities: string[];
  electricity_included: boolean;
  cleaning_included: boolean;
  is_active: boolean;
  images: RoomImage[];
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: number;
  name: string;
  location: string;
  description: string;
  cover_image: string | null;
  amenities: string[];
  electricity_included: boolean;
  cleaning_included: boolean;
  images: PropertyImage[];
  rooms: Room[];
  created_at: string;
  updated_at: string;
};

export type AuthenticatedUser = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  date_of_birth?: string | null;
  profile_completed: boolean;
  default_home_path: string;
  university_domain?: string;
  is_student_verified?: boolean;
  email_verified_at?: string | null;
  properties?: {
    id: number;
    name: string;
    location: string;
    cover_image?: string;
    rooms_count?: number;
    electricity_included?: boolean;
    cleaning_included?: boolean;
  }[];
};

export type PropertyPayload = {
  name: string;
  location: string;
  description?: string;
  amenities?: string[];
  electricity_included?: boolean;
  cleaning_included?: boolean;
};

export type RoomPayload = {
  name: string;
  room_type: RoomType;
  description?: string;
  price_per_month: string;
  capacity?: number;
  available_quantity?: number;
  amenities?: string[];
  electricity_included?: boolean;
  cleaning_included?: boolean;
  is_active?: boolean;
};

export type AuthResponse = {
  access: string;
  refresh: string;
  default_home_path: string;
  user: AuthenticatedUser;
};

export type TokenLoginResponse = AuthResponse;

export type SeekerProfileCompletionBody = {
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: "MALE" | "FEMALE";
};

export type OwnerProfileCompletionBody = {
  full_name: string;
  phone: string;
  email: string;
};

export type ProfileCompletionResponse = AuthenticatedUser;