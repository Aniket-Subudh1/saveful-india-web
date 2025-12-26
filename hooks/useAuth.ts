"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { UserRole } from "@/types/auth";

export function useAuth(requiredRole: UserRole) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getStoredToken(requiredRole);

      if (!token) {
        router.push(`/${requiredRole}/login`);
        return;
      }

      const isValid = await authService.validateToken(token, requiredRole);

      if (!isValid) {
        router.push(`/${requiredRole}/login`);
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole, router]);

  return { isAuthenticated, isLoading };
}

export function useCurrentUser(role: UserRole) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = authService.getStoredUser(role);
    setUser(storedUser);
  }, [role]);

  return user;
}
