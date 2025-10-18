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
  default_home_path: string;
};

export type AuthResponse = {
  access: string;
  refresh: string;
  default_home_path: string;
  user: AuthenticatedUser;
};

export type TokenLoginResponse = AuthResponse;
