import { LoginCredentials, AuthResponse, UserRole } from "@/types/auth";

interface IAuthService {
  login(credentials: LoginCredentials, role: UserRole): Promise<AuthResponse>;
  logout(role?: UserRole): Promise<void>;
  validateToken(token: string, role: UserRole): Promise<boolean>;
  refreshToken(role: UserRole): Promise<boolean>;
}

class AuthService implements IAuthService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  private refreshingTokenPromise: Promise<boolean> | null = null;

  async login(
    credentials: LoginCredentials,
    role: UserRole
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/${role}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      if (data.accessToken) {
        localStorage.setItem(`${role}_token`, data.accessToken);
        localStorage.setItem(`${role}_refresh_token`, data.refreshToken || "");
        localStorage.setItem(`${role}_user`, JSON.stringify(data.user));
      }

      return {
        success: true,
        token: data.accessToken,
        user: data.user,
        message: "Login successful",
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("An unexpected error occurred");
    }
  }

  async logout(role?: UserRole): Promise<void> {
    if (role) {
      // Clear specific role
      localStorage.removeItem(`${role}_token`);
      localStorage.removeItem(`${role}_refresh_token`);
      localStorage.removeItem(`${role}_user`);
    } else {
      // Clear all roles (complete logout)
      const roles: UserRole[] = ["admin", "chef"];
      roles.forEach((r) => {
        localStorage.removeItem(`${r}_token`);
        localStorage.removeItem(`${r}_refresh_token`);
        localStorage.removeItem(`${r}_user`);
      });
    }
  }

  async validateToken(token: string, role: UserRole): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken(role);
        return refreshed;
      }

      return response.ok;
    } catch {
      return false;
    }
  }

  async refreshToken(role: UserRole): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshingTokenPromise) {
      return this.refreshingTokenPromise;
    }

    this.refreshingTokenPromise = this._performRefresh(role);
    
    try {
      const result = await this.refreshingTokenPromise;
      return result;
    } finally {
      this.refreshingTokenPromise = null;
    }
  }

  private async _performRefresh(role: UserRole): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem(`${role}_refresh_token`);
      
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh token invalid or expired
        await this.logout(role);
        return false;
      }

      const data = await response.json();

      if (data.accessToken) {
        localStorage.setItem(`${role}_token`, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(`${role}_refresh_token`, data.refreshToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.logout(role);
      return false;
    }
  }

  getStoredToken(role: UserRole): string | null {
    return localStorage.getItem(`${role}_token`);
  }

  getStoredRefreshToken(role: UserRole): string | null {
    return localStorage.getItem(`${role}_refresh_token`);
  }

  getStoredUser(role: UserRole) {
    const userStr = localStorage.getItem(`${role}_user`);
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();

export const createAuthHandler = (role: UserRole) => {
  return async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials, role);

    if (response.success) {
      window.location.href = `/${role}/dashboard`;
    } else {
      throw new Error(response.message || "Login failed");
    }
  };
};
