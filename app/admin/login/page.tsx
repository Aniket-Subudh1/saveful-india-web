"use client";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { createAuthHandler } from "@/services/authService";
import Image from "next/image";

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF7F0]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left purple ingredient */}
        <div className="absolute left-12 top-20 h-36 w-36 -rotate-12 opacity-25">
          <Image
            src="/ingredients/hero-purple@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center-left green ingredient */}
        <div className="absolute left-1/4 top-12 h-40 w-40 rotate-6 opacity-28">
          <Image
            src="/ingredients/hero-green@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center red ingredient */}
        <div className="absolute left-1/2 top-8 h-32 w-32 -translate-x-1/2 rotate-12 opacity-22">
          <Image
            src="/ingredients/hero-red@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center-right orange ingredient */}
        <div className="absolute right-1/4 top-16 h-44 w-44 -rotate-15 opacity-30">
          <Image
            src="/ingredients/hero-orange@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top right yellow ingredient */}
        <div className="absolute right-16 top-24 h-38 w-38 rotate-20 opacity-26">
          <Image
            src="/ingredients/hero-yellow@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Enhanced cooking pot SVG - top right corner */}
        <div className="absolute right-8 top-8 h-40 w-40 rotate-12 opacity-12">
          <svg viewBox="0 0 200 180" fill="none" className="h-full w-full">
            <ellipse cx="100" cy="100" rx="60" ry="55" fill="#2D5F4F" opacity="0.4"/>
            <ellipse cx="100" cy="95" rx="60" ry="8" fill="#4A8070" opacity="0.5"/>
            <path d="M 35 85 Q 20 85, 20 100 Q 20 115, 35 115" stroke="#2D5F4F" strokeWidth="8" fill="none" opacity="0.4"/>
            <path d="M 165 85 Q 180 85, 180 100 Q 180 115, 165 115" stroke="#2D5F4F" strokeWidth="8" fill="none" opacity="0.4"/>
            <ellipse cx="100" cy="55" rx="55" ry="10" fill="#4A8070" opacity="0.5"/>
            <circle cx="100" cy="50" r="8" fill="#2D5F4F" opacity="0.4"/>
          </svg>
        </div>

        {/* Middle left pink ingredient */}
        <div className="absolute left-8 top-1/2 h-42 w-42 -translate-y-1/2 rotate-15 opacity-24">
          <Image
            src="/ingredients/hero-pink@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Middle right green ingredient */}
        <div className="absolute right-12 top-1/2 h-40 w-40 -translate-y-1/2 -rotate-20 opacity-26">
          <Image
            src="/ingredients/hero-green@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Cutting board SVG - middle left */}
        <div className="absolute left-16 top-1/3 h-32 w-32 -rotate-15 opacity-10">
          <svg viewBox="0 0 180 120" fill="none" className="h-full w-full">
            <rect x="20" y="20" width="140" height="85" rx="8" fill="#A68FD9" opacity="0.5"/>
            <rect x="25" y="25" width="130" height="75" rx="5" fill="#C4B5E8" opacity="0.3"/>
            <rect x="70" y="5" width="40" height="20" rx="10" fill="#A68FD9" opacity="0.5"/>
            <circle cx="90" cy="12" r="4" fill="none" stroke="#C4B5E8" strokeWidth="2"/>
          </svg>
        </div>

        {/* Knife SVG - middle right area */}
        <div className="absolute right-20 top-2/3 h-28 w-28 rotate-35 opacity-11">
          <svg viewBox="0 0 200 60" fill="none" className="h-full w-full">
            <path d="M 10 25 L 140 25 L 145 30 L 10 30 Z" fill="#6B6B6B" opacity="0.6"/>
            <path d="M 10 26 L 140 26 L 144 30 L 10 29 Z" fill="#999" opacity="0.3"/>
            <rect x="145" y="20" width="45" height="15" rx="7" fill="#2D5F4F" opacity="0.5"/>
            <rect x="148" y="22" width="39" height="11" rx="5" fill="#4A8070" opacity="0.3"/>
          </svg>
        </div>

        {/* Bottom left orange ingredient */}
        <div className="absolute left-20 bottom-20 h-46 w-46 rotate-8 opacity-28">
          <Image
            src="/ingredients/hero-orange@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Bottom center-left purple ingredient */}
        <div className="absolute left-1/3 bottom-16 h-38 w-38 -rotate-10 opacity-24">
          <Image
            src="/ingredients/hero-purple@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Bottom center-right yellow ingredient */}
        <div className="absolute right-1/3 bottom-12 h-40 w-40 rotate-18 opacity-27">
          <Image
            src="/ingredients/hero-yellow@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Bottom right pink ingredient */}
        <div className="absolute right-16 bottom-24 h-42 w-42 -rotate-12 opacity-26">
          <Image
            src="/ingredients/hero-pink@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Spoon SVG - bottom left area */}
        <div className="absolute left-1/4 bottom-8 h-36 w-36 -rotate-25 opacity-11">
          <svg viewBox="0 0 80 200" fill="none" className="h-full w-full">
            <ellipse cx="40" cy="35" rx="25" ry="30" fill="#F7931E" opacity="0.5"/>
            <rect x="35" y="60" width="10" height="120" rx="5" fill="#F7931E" opacity="0.6"/>
            <rect x="37" y="62" width="6" height="116" rx="3" fill="#FFB366" opacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <AuthLoginForm
          config={{
            role: "admin",
            title: "Admin Login",
            subtitle: "Sign in to access the admin dashboard and manage the platform",
            emailPlaceholder: "admin@saveful.in",
            onSubmit: createAuthHandler("admin"),
          }}
        />
      </div>
    </div>
  );
}
