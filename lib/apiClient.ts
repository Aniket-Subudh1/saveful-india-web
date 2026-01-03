import { authService } from "@/services/authService";
import { UserRole } from "@/types/auth";

interface RequestOptions extends RequestInit {
  role: UserRole;
  skipAuth?: boolean;
}

export async function apiClient(
  url: string,
  options: RequestOptions
): Promise<Response> {
  const { role, skipAuth, ...fetchOptions } = options;

  // Get current token
  const token = authService.getStoredToken(role);

  if (!skipAuth && !token) {
    throw new Error("No authentication token available");
  }

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...fetchOptions,
    headers,
    // Avoid conditional requests that may return 304 and break UI
    cache: 'no-store',
  });

  // Handle unauthorized by attempting token refresh
  if (response.status === 401 && !skipAuth) {
    const refreshed = await authService.refreshToken(role);

    if (refreshed) {
      const newToken = authService.getStoredToken(role);
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          cache: 'no-store',
        });
      }
    } else {
      if (typeof window !== "undefined") {
        window.location.href = `/${role}/login`;
      }
      throw new Error("Session expired. Please login again.");
    }
  }

  // Gracefully handle 304 Not Modified by refetching without cache
  if (response.status === 304) {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      cache: 'reload',
    });
  }

  return response;
}

export async function apiGet(
  url: string,
  role: UserRole,
  skipAuth = false
): Promise<Response> {
  return apiClient(url, {
    method: "GET",
    role,
    skipAuth,
  });
}

export async function apiPost(
  url: string,
  body: any,
  role: UserRole,
  skipAuth = false
): Promise<Response> {
  return apiClient(url, {
    method: "POST",
    role,
    skipAuth,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut(
  url: string,
  body: any,
  role: UserRole,
  skipAuth = false
): Promise<Response> {
  return apiClient(url, {
    method: "PUT",
    role,
    skipAuth,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch(
  url: string,
  body: any,
  role: UserRole,
  skipAuth = false
): Promise<Response> {
  return apiClient(url, {
    method: "PATCH",
    role,
    skipAuth,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(
  url: string,
  role: UserRole,
  skipAuth = false
): Promise<Response> {
  return apiClient(url, {
    method: "DELETE",
    role,
    skipAuth,
  });
}
