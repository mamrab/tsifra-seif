import React from 'react';

interface TsifraLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const TsifraLogo: React.FC<TsifraLogoProps> = ({
  size = 48,
  className = '',
  withGlow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl scale-110 pointer-events-none transition-opacity duration-500"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tlChassis" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#181a26" />
            <stop offset="45%" stopColor="#0d0e17" />
            <stop offset="100%" stopColor="#040508" />
          </linearGradient>

          <linearGradient id="tlRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          <radialGradient id="tlNebula" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="80%" stopColor="#7000ff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="tlShield" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="tlCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="tlSheen" x1="0%" y1="0%" x2="60%" y2="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter id="tlGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Chassis Squircle */}
        <rect x="32" y="32" width="448" height="448" rx="108" ry="108" fill="url(#tlChassis)" />
        <rect x="32" y="32" width="448" height="448" rx="108" ry="108" fill="url(#tlNebula)" />
        <rect
          x="32.5"
          y="32.5"
          width="447"
          height="447"
          rx="107.5"
          ry="107.5"
          fill="none"
          stroke="url(#tlRim)"
          strokeWidth="2"
        />

        {/* Specular Diagonal Sheen */}
        <path
          d="M 32 140 C 32 80, 80 32, 140 32 L 372 32 C 220 180, 100 300, 32 400 Z"
          fill="url(#tlSheen)"
        />

        {/* Precision Cipher Rings */}
        <g stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round">
          <circle
            cx="256"
            cy="256"
            r="150"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.14"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
          <circle cx="256" cy="256" r="126" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />

          {/* Notch Marks */}
          <line x1="256" y1="94" x2="256" y2="104" strokeOpacity="0.7" strokeWidth="2.5" />
          <line x1="256" y1="408" x2="256" y2="418" strokeOpacity="0.7" strokeWidth="2.5" />
          <line x1="94" y1="256" x2="104" y2="256" strokeOpacity="0.7" strokeWidth="2.5" />
          <line x1="408" y1="256" x2="418" y2="256" strokeOpacity="0.7" strokeWidth="2.5" />
          <line x1="142" y1="142" x2="149" y2="149" strokeOpacity="0.4" />
          <line x1="370" y1="142" x2="363" y2="149" strokeOpacity="0.4" />
          <line x1="142" y1="370" x2="149" y2="363" strokeOpacity="0.4" />
          <line x1="370" y1="370" x2="363" y2="363" strokeOpacity="0.4" />
        </g>

        {/* Geometric Crypto Shield */}
        <g filter="url(#tlGlow)">
          <path
            d="M 256 128 C 310 128, 356 142, 368 152 C 368 244, 340 316, 256 364 C 172 316, 144 244, 144 152 C 156 142, 202 128, 256 128 Z"
            fill="none"
            stroke="url(#tlShield)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 256 140 C 300 140, 342 152, 354 160 C 354 238, 330 302, 256 346 C 182 302, 158 238, 158 160 C 170 152, 212 140, 256 140 Z"
            fill="#060810"
            fillOpacity="0.55"
            stroke="url(#tlCore)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
        </g>

        {/* Shackle & Lock Mechanism */}
        <g filter="url(#tlGlow)">
          <path
            d="M 216 230 L 216 198 C 216 174, 234 156, 256 156 C 278 156, 296 174, 296 198 L 296 230"
            fill="none"
            stroke="url(#tlShield)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <rect
            x="202"
            y="222"
            width="108"
            height="88"
            rx="22"
            ry="22"
            fill="#0b0f19"
            stroke="url(#tlCore)"
            strokeWidth="2.5"
          />
          <circle cx="256" cy="254" r="13" fill="url(#tlCore)" />
          <path
            d="M 253 258 L 251 282 C 251 284, 253 286, 256 286 C 259 286, 261 284, 261 282 L 259 258 Z"
            fill="url(#tlCore)"
          />
          <circle cx="256" cy="254" r="5" fill="#ffffff" />
        </g>

        {/* Quantum Micro Nodes */}
        <circle cx="256" cy="99" r="4" fill="#ffffff" />
        <circle cx="364" cy="149" r="3.5" fill="#38bdf8" />
        <circle cx="148" cy="149" r="3.5" fill="#38bdf8" />
        <circle cx="256" cy="364" r="4" fill="#60a5fa" />

        {/* Top Edge Specular Highlight */}
        <line
          x1="160"
          y1="34"
          x2="352"
          y2="34"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

