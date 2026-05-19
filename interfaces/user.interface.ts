import type { UserRole } from '../enums/user-role.enum';

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
