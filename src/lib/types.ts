export type Role = "SEEKER" | "OWNER";

export type RegisterBody = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
};

export type LoginBody = {
  identifier: string;
  password: string;
  remember_me?: boolean;
};

export type TokenLoginResponse = {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    role: Role;
    is_verified: boolean;
  };
};

export type VerificationRequestBody = {
  identifier: string;
};

export type VerificationConfirmBody = {
  identifier: string;
  code: string;
};

export type VerificationResponse = {
  detail: string;
};
