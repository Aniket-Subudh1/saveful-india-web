"use client";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { createAuthHandler } from "@/services/authService";
import Image from "next/image";

export default function ChefLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF7F0]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top left green ingredient */}
        <div className="absolute left-10 top-16 h-42 w-42 -rotate-15 opacity-27">
          <Image
            src="/ingredients/hero-green@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center-left purple ingredient */}
        <div className="absolute left-1/4 top-10 h-36 w-36 rotate-10 opacity-24">
          <Image
            src="/ingredients/hero-purple@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center illustration */}
        <div className="absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 opacity-18">
          <Image
            src="/Illustration@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top center-right orange ingredient */}
        <div className="absolute right-1/4 top-14 h-48 w-48 -rotate-8 opacity-30">
          <Image
            src="/ingredients/hero-orange@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Top right yellow ingredient */}
        <div className="absolute right-12 top-20 h-40 w-40 rotate-16 opacity-26">
          <Image
            src="/ingredients/hero-yellow@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Enhanced frying pan SVG - top right corner */}
        <div className="absolute right-6 top-8 h-42 w-42 rotate-20 opacity-13">
          <svg viewBox="0 0 200 140" fill="none" className="h-full w-full">
            <ellipse cx="90" cy="70" rx="65" ry="55" fill="#F7931E" opacity="0.5"/>
            <ellipse cx="90" cy="65" rx="65" ry="8" fill="#FFB366" opacity="0.4"/>
            <ellipse cx="90" cy="75" rx="55" ry="45" fill="#F7931E" opacity="0.3"/>
            <rect x="150" y="62" width="45" height="16" rx="8" fill="#F7931E" opacity="0.6"/>
            <rect x="152" y="64" width="41" height="12" rx="6" fill="#FFB366" opacity="0.3"/>
          </svg>
        </div>

        {/* Whisk SVG - top left area */}
        <div className="absolute left-6 top-1/4 h-46 w-46 -rotate-15 opacity-11">
          <svg viewBox="0 0 80 200" fill="none" className="h-full w-full">
            <rect x="35" y="10" width="10" height="100" rx="5" fill="#A68FD9" opacity="0.6"/>
            <path d="M 40 110 Q 25 140, 20 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 30 140, 28 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 35 145, 36 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 40 145, 40 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 45 145, 44 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 50 140, 52 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <path d="M 40 110 Q 55 140, 60 170" stroke="#A68FD9" strokeWidth="3" fill="none" opacity="0.5"/>
            <ellipse cx="40" cy="165" rx="20" ry="8" fill="none" stroke="#A68FD9" strokeWidth="2" opacity="0.4"/>
          </svg>
        </div>

        {/* Middle left pink ingredient */}
        <div className="absolute left-12 top-1/2 h-40 w-40 -translate-y-1/2 rotate-12 opacity-26">
          <Image
            src="/ingredients/hero-pink@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Middle center-left yellow ingredient */}
        <div className="absolute left-1/3 top-1/2 h-36 w-36 -translate-y-1/2 -rotate-18 opacity-22">
          <Image
            src="/ingredients/hero-yellow@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Middle right red ingredient */}
        <div className="absolute right-10 top-1/2 h-44 w-44 -translate-y-1/2 rotate-25 opacity-28">
          <Image
            src="/ingredients/hero-red@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Mortar and Pestle SVG - middle right */}
        <div className="absolute right-1/4 top-1/2 h-40 w-40 -translate-y-1/2 -rotate-10 opacity-12">
          <svg viewBox="0 0 140 160" fill="none" className="h-full w-full">
            <path d="M 30 80 Q 25 120, 40 140 L 100 140 Q 115 120, 110 80 Z" fill="#2D5F4F" opacity="0.5"/>
            <ellipse cx="70" cy="80" rx="40" ry="12" fill="#4A8070" opacity="0.4"/>
            <ellipse cx="85" cy="45" rx="12" ry="18" fill="#2D5F4F" opacity="0.6" transform="rotate(-25 85 45)"/>
            <rect x="80" y="35" width="10" height="50" rx="5" fill="#2D5F4F" opacity="0.6" transform="rotate(-25 85 60)"/>
          </svg>
        </div>

        {/* Bottom left green ingredient */}
        <div className="absolute left-16 bottom-20 h-46 w-46 rotate-14 opacity-27">
          <Image
            src="/ingredients/hero-green@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Bottom center-left pink ingredient */}
        <div className="absolute left-1/3 bottom-14 h-38 w-38 -rotate-8 opacity-24">
          <Image
            src="/ingredients/hero-pink@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Chef's knife SVG - bottom center */}
        <div className="absolute left-1/2 bottom-10 h-32 w-32 -translate-x-1/2 rotate-30 opacity-11">
          <svg viewBox="0 0 220 70" fill="none" className="h-full w-full">
            <path d="M 10 30 L 150 20 L 155 35 L 10 40 Z" fill="#6B6B6B" opacity="0.7"/>
            <path d="M 10 31 L 150 21 L 154 35 L 10 39 Z" fill="#999" opacity="0.4"/>
            <rect x="155" y="25" width="55" height="18" rx="9" fill="#2D5F4F" opacity="0.6"/>
            <rect x="158" y="27" width="49" height="14" rx="7" fill="#4A8070" opacity="0.4"/>
            <circle cx="168" cy="35" r="3" fill="#6B6B6B" opacity="0.5"/>
            <circle cx="188" cy="35" r="3" fill="#6B6B6B" opacity="0.5"/>
          </svg>
        </div>

        {/* Bottom center-right purple ingredient */}
        <div className="absolute right-1/3 bottom-16 h-42 w-42 rotate-20 opacity-25">
          <Image
            src="/ingredients/hero-purple@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Bottom right orange ingredient */}
        <div className="absolute right-14 bottom-22 h-44 w-44 -rotate-15 opacity-29">
          <Image
            src="/ingredients/hero-orange@2x.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Ladle SVG - bottom right area */}
        <div className="absolute right-8 bottom-1/3 h-44 w-44 -rotate-40 opacity-10">
          <svg viewBox="0 0 100 180" fill="none" className="h-full w-full">
            <ellipse cx="50" cy="150" rx="30" ry="25" fill="#F7931E" opacity="0.6"/>
            <ellipse cx="50" cy="145" rx="30" ry="8" fill="#FFB366" opacity="0.4"/>
            <rect x="45" y="20" width="10" height="130" rx="5" fill="#F7931E" opacity="0.6"/>
            <rect x="47" y="22" width="6" height="126" rx="3" fill="#FFB366" opacity="0.3"/>
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <AuthLoginForm
          config={{
            role: "chef",
            title: "Chef Login",
            subtitle: "Sign in to access your chef dashboard and manage your recipes",
            emailPlaceholder: "chef@saveful.in",
            onSubmit: createAuthHandler("chef"),
          }}
        />
      </div>
    </div>
  );
}
