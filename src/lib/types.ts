export type Role = "SEEKER" | "OWNER";

export type RegisterBody = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
  university_email?: string;
  student_id?: string;
};

export type StudentVerificationRequestBody = {
  email: string;
  student_id: string;
};

export type StudentVerificationResponse = {
  verification_token: string;
};

export type StudentVerificationConfirmBody = {
  verification_token: string;
  code: string;
};

export type StudentVerificationConfirmResponse = {
  verified: boolean;
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
  };
};
