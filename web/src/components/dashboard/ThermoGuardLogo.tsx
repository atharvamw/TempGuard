import React from "react";

interface ThermoGuardLogoProps {
  className?: string;
  size?: number;
}

export function ThermoGuardLogo({ className = "", size = 44 }: ThermoGuardLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 rounded-xl overflow-hidden shadow-sm p-1.5 flex items-center justify-center bg-gradient-to-br from-emerald-950/40 via-card to-background border border-emerald-500/30 ${className}`}
    >
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoShieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="50%" stop-color="#059669" />
            <stop offset="100%" stop-color="#10b981" />
          </linearGradient>

          <linearGradient id="logoShieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#064e3b" stop-opacity="0.05" />
          </linearGradient>

          <linearGradient id="logoMercuryGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="40%" stop-color="#10b981" />
            <stop offset="85%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#a7f3d0" />
          </linearGradient>
        </defs>

        {/* Shield Protective Contour */}
        <path
          d="M 256 68 
             C 334 68 392 94 402 144
             C 402 248 356 364 256 428
             C 156 364 110 248 110 144
             C 120 94 178 68 256 68 Z"
          fill="url(#logoShieldFill)"
          stroke="url(#logoShieldBorder)"
          strokeWidth="14"
          strokeLinejoin="round"
        />

        {/* Wireless / IoT Radio Signal Arcs (Top Right) */}
        <path
          d="M 318 132 A 44 44 0 0 1 354 168"
          stroke="#34d399"
          strokeWidth="12"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        <path
          d="M 334 116 A 66 66 0 0 1 388 170"
          stroke="#10b981"
          strokeWidth="10"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />

        {/* Thermometer Glass Housing Outline */}
        <path
          d="M 240 160
             A 16 16 0 0 1 272 160
             L 272 284.5
             A 42 42 0 1 1 240 284.5
             Z"
          fill="#022c22"
          stroke="#34d399"
          strokeWidth="10"
          strokeLinejoin="round"
        />

        {/* Graduation Tick Marks */}
        <line x1="272" y1="188" x2="286" y2="188" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round" />
        <line x1="272" y1="216" x2="282" y2="216" stroke="#6ee7b7" strokeWidth="6" strokeLinecap="round" />
        <line x1="272" y1="244" x2="286" y2="244" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round" />

        {/* Thermometer Mercury Fluid Column */}
        <path
          d="M 248 198
             A 8 8 0 0 1 264 198
             L 264 290
             A 30 30 0 1 1 248 290
             Z"
          fill="url(#logoMercuryGrad)"
        />

        {/* Glossy Specular Highlight */}
        <ellipse cx="250" cy="308" rx="7" ry="12" fill="#ffffff" fillOpacity="0.6" transform="rotate(-25 250 308)" />
      </svg>
    </div>
  );
}
