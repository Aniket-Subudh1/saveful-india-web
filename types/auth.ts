export type UserRole = "admin" | "chef";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  emailPlaceholder?: string;
  onSubmit: (credentials: LoginCredentials) => Promise<void> | void;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    phoneNumber?: string;
  };
}

export interface ChefCreateDto {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}
