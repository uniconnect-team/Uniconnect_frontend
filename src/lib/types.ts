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
  }[];
  dorms?: {
    id: number;
    name: string;
    property: number;
    cover_photo?: string | null;
    is_active: boolean;
  }[];
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

export type OwnerProperty = {
  id: number;
  name: string;
  location: string;
};

export type DormGalleryImage = {
  id: number;
  dorm?: number;
  room?: number;
  image: string;
  caption?: string | null;
  created_at?: string;
};

export type DormRoom = {
  id: number;
  dorm: number;
  name: string;
  room_type: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" | "STUDIO" | "OTHER";
  capacity: number;
  price_per_month: string;
  total_units: number;
  available_units: number;
  is_available: boolean;
  description?: string | null;
  images?: DormGalleryImage[];
};

export type OwnerDorm = {
  id: number;
  name: string;
  property: number;
  property_detail?: OwnerProperty;
  description?: string | null;
  amenities: string[];
  has_room_service: boolean;
  has_electricity: boolean;
  has_water: boolean;
  has_internet: boolean;
  is_active: boolean;
  cover_photo?: string | null;
  rooms?: DormRoom[];
  images?: DormGalleryImage[];
  created_at?: string;
  updated_at?: string;
};

export type DormRequestBody = {
  name: string;
  property: number;
  description?: string;
  amenities: string[];
  has_room_service: boolean;
  has_electricity: boolean;
  has_water: boolean;
  has_internet: boolean;
  is_active: boolean;
  cover_photo?: File | null;
};

export type DormRoomRequestBody = {
  dorm: number;
  name: string;
  room_type: DormRoom["room_type"];
  capacity: number;
  price_per_month: string | number;
  total_units: number;
  available_units: number;
  is_available: boolean;
  description?: string;
};

export type BookingRequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";

export type BookingRequest = {
  id: number;
  dorm: number;
  room?: number | null;
  dorm_summary?: {
    id: number;
    name: string;
    property_name?: string;
    cover_photo?: string | null;
  };
  seeker_name: string;
  seeker_email: string;
  seeker_phone: string;
  check_in: string;
  check_out: string;
  status: BookingRequestStatus;
  owner_note?: string | null;
  responded_at?: string | null;
  created_at?: string;
};

export type BookingRequestFilters = {
  status?: BookingRequestStatus;
  dorm?: number;
  room?: number;
};

export type BookingRequestPayload = {
  dorm: number;
  room?: number | null;
  seeker_name: string;
  seeker_email: string;
  seeker_phone: string;
  check_in: string;
  check_out: string;
  status?: BookingRequestStatus;
  owner_note?: string | null;
};

export type RoommateProfile = {
  id: number;
  sleep_schedule: "EARLY_BIRD" | "NIGHT_OWL" | "FLEXIBLE";
  cleanliness_level: "VERY_CLEAN" | "MODERATELY_CLEAN" | "RELAXED";
  social_preference: "VERY_SOCIAL" | "MODERATELY_SOCIAL" | "PREFER_QUIET";
  study_habits: "LIBRARY" | "DORM" | "BOTH";
  interests: string;
  budget_range: string;
  preferred_gender: string;
  is_active: boolean;
  
  bio: string;
  user_info: {
    id: number;
    full_name: string;
    university_domain: string;
  };
  created_at: string;
  updated_at: string;
};

export interface RoommateMatch {
  id: number;
  seeker: number;
  match: number;
  compatibility_score: number;
  is_viewed: boolean;
  is_favorited: boolean;
  created_at: string;
  match_info: {
    id: number;
    full_name: string;
    email: string;
    university_domain: string;
  };
  match_profile: {
    sleep_schedule: string;
    cleanliness_level: string;
    social_preference: string;
    study_habits: string;
    interests: string;
    budget_range: string;
    preferred_gender: string;  // ADD THIS LINE
    bio: string;
  };
}

export type RoommateRequest = {
  id: number;
  receiver: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  response_message: string;
  sender_info: {
    id: number;
    full_name: string;
    email: string;
  };
  receiver_info: {
    id: number;
    full_name: string;
    email: string;
  };
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};