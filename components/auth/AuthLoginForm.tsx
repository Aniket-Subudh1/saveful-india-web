"use client";
import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { LoginFormConfig, LoginCredentials } from "@/types/auth";
import Image from "next/image";

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-[#A68FD9] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-[#F7931E] to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export function AuthLoginForm({ config }: { config: LoginFormConfig }) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await config.onSubmit(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // Determine role-based styling
  const roleColor = config.role === "admin" ? "#2D5F4F" : "#F7931E";
  const roleGradient =
    config.role === "admin"
      ? "from-[#2D5F4F] to-[#4A8070]"
      : "from-[#F7931E] to-[#FFB366]";

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl md:p-10">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#A68FD9]/10"></div>
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-[#E8B4D9]/10"></div>

      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <div className="relative h-16 w-40">
          <Image
            src="/logo@2x.png"
            alt="Saveful Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Badge */}
      <div className="mb-6 flex justify-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${roleColor}15`,
            color: roleColor,
          }}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: roleColor }}
          ></div>
          {config.role} Portal
        </div>
      </div>

      {/* Title */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-[#1a1a1a] md:text-3xl">
          {config.title}
        </h2>
        <p className="text-sm text-[#6B6B6B]">{config.subtitle}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-start gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <LabelInputContainer>
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 pl-4">
              <svg
                className="h-5 w-5 text-[#6B6B6B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>
            <Input
              id="email"
              placeholder={config.emailPlaceholder || "Enter your email"}
              type="email"
              value={credentials.email}
              onChange={handleInputChange("email")}
              required
              disabled={isLoading}
              className="pl-12"
            />
          </div>
        </LabelInputContainer>

        <LabelInputContainer>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 pl-4">
              <svg
                className="h-5 w-5 text-[#6B6B6B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={handleInputChange("password")}
              required
              disabled={isLoading}
              className="pl-12 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 pr-4 text-[#6B6B6B] transition-colors hover:text-[#2D5F4F] focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </LabelInputContainer>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-0"
            />
            <span className="text-[#6B6B6B]">Remember me</span>
          </label>
          <button
            type="button"
            className="font-medium text-[#2D5F4F] transition-colors hover:text-[#4A8070]"
          >
            Forgot password?
          </button>
        </div>

        <button
          className={cn(
            "group/btn relative block h-12 w-full rounded-xl bg-gradient-to-r font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
            roleGradient
          )}
          type="submit"
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <svg
                  className="h-5 w-5 transition-transform group-hover/btn:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </span>
          <BottomGradient />
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#6B6B6B]">
          Protected by Saveful Security &middot;{" "}
          <a href="#" className="font-medium text-[#2D5F4F] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

