"use client";

import { cn } from "@/lib/utils";

interface VerifAIAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function VerifAIAvatar({
  size = "md",
  className,
  animate = true,
}: VerifAIAvatarProps) {
  return (
    <div className={cn(sizeClasses[size], "relative", className)}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Glow */}
        <circle cx="100" cy="100" r="85" fill="url(#bgGlow)" opacity="0.3" />

        {/* Main Body */}
        <ellipse cx="100" cy="115" rx="55" ry="50" fill="url(#bodyGradient)" />

        {/* Head */}
        <circle cx="100" cy="70" r="40" fill="url(#headGradient)" />

        {/* Antennae */}
        <g opacity="0.9">
          <path
            d="M75 45 Q65 25, 60 20"
            stroke="url(#antennaGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          >
            {animate && (
              <animate
                attributeName="d"
                values="M75 45 Q65 25, 60 20;M75 45 Q62 22, 58 18;M75 45 Q68 28, 62 22;M75 45 Q65 20, 60 15;M75 45 Q65 25, 60 20"
                dur="5s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <circle cx="60" cy="20" r="6" fill="url(#orbGlow)">
            {animate && (
              <>
                <animate
                  attributeName="cx"
                  values="60;58;62;60"
                  dur="5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="20;18;22;15;20"
                  dur="5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="6;8;6;7;6"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>

          <path
            d="M125 45 Q135 25, 140 20"
            stroke="url(#antennaGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          >
            {animate && (
              <animate
                attributeName="d"
                values="M125 45 Q135 25, 140 20;M125 45 Q138 22, 142 18;M125 45 Q132 28, 138 22;M125 45 Q135 20, 140 15;M125 45 Q135 25, 140 20"
                dur="5.5s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <circle cx="140" cy="20" r="6" fill="url(#orbGlow)">
            {animate && (
              <>
                <animate
                  attributeName="cx"
                  values="140;142;138;140"
                  dur="5.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="20;18;22;15;20"
                  dur="5.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="6;7;6;8;6"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
        </g>

        {/* Eyes */}
        <g>
          <ellipse cx="85" cy="65" rx="12" ry="14" fill="white" />
          <circle cx="87" cy="67" r="8" fill="url(#eyeGradient)">
            {animate && (
              <>
                <animate
                  attributeName="cx"
                  values="87;89;85;87"
                  dur="4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="67;66;68;67"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
          <circle cx="89" cy="65" r="3" fill="white" opacity="0.8">
            {animate && (
              <animate
                attributeName="cx"
                values="89;91;87;89"
                dur="4s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          <ellipse cx="115" cy="65" rx="12" ry="14" fill="white" />
          <circle cx="113" cy="67" r="8" fill="url(#eyeGradient)">
            {animate && (
              <>
                <animate
                  attributeName="cx"
                  values="113;111;115;113"
                  dur="4.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="67;68;66;67"
                  dur="3.8s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
          <circle cx="111" cy="65" r="3" fill="white" opacity="0.8">
            {animate && (
              <animate
                attributeName="cx"
                values="111;109;113;111"
                dur="4.2s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Blink */}
          {animate && (
            <>
              <rect
                x="73"
                y="64"
                width="24"
                height="2"
                fill="url(#headGradient)"
                opacity="0"
              >
                <animate
                  attributeName="opacity"
                  values="0;0;1;0;0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </rect>
              <rect
                x="103"
                y="64"
                width="24"
                height="2"
                fill="url(#headGradient)"
                opacity="0"
              >
                <animate
                  attributeName="opacity"
                  values="0;0;1;0;0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </rect>
            </>
          )}
        </g>

        {/* Mouth */}
        <path
          d="M85 80 Q100 90, 115 80"
          stroke="url(#mouthGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks */}
        <ellipse cx="70" cy="75" rx="8" ry="5" fill="#FF6B9D" opacity="0.3" />
        <ellipse
          cx="130"
          cy="75"
          rx="8"
          ry="5"
          fill="#FF6B9D"
          opacity="0.3"
        />

        {/* Arms */}
        <g opacity="0.9">
          <path
            d="M50 110 Q35 115, 30 125"
            stroke="url(#armGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          >
            {animate && (
              <animate
                attributeName="d"
                values="M50 110 Q35 115, 30 125;M50 110 Q35 120, 28 130;M50 110 Q35 115, 30 125"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <circle cx="30" cy="125" r="8" fill="url(#nodeGradient)">
            {animate && (
              <animate
                attributeName="cy"
                values="125;130;125"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          <path
            d="M150 110 Q165 115, 170 125"
            stroke="url(#armGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          >
            {animate && (
              <animate
                attributeName="d"
                values="M150 110 Q165 115, 170 125;M150 110 Q165 120, 172 130;M150 110 Q165 115, 170 125"
                dur="2.5s"
                begin="1.25s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <circle cx="170" cy="125" r="8" fill="url(#nodeGradient)">
            {animate && (
              <animate
                attributeName="cy"
                values="125;130;125"
                dur="2.5s"
                begin="1.25s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>

        {/* Belly Badge */}
        <circle cx="100" cy="125" r="15" fill="url(#badgeGradient)" opacity="0.3" />
        <path
          d="M92 125 L97 130 L108 119"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Data Particles */}
        {animate && (
          <g opacity="0.6">
            <circle cx="40" cy="70" r="3" fill="#60A5FA">
              <animate
                attributeName="cy"
                values="70;65;70"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="160" cy="85" r="3" fill="#A78BFA">
              <animate
                attributeName="cy"
                values="85;80;85"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50" cy="140" r="2.5" fill="#60A5FA">
              <animate
                attributeName="cx"
                values="50;45;50"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="150" cy="145" r="2.5" fill="#A78BFA">
              <animate
                attributeName="cx"
                values="150;155;150"
                dur="2.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Gradients */}
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="antennaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
          </linearGradient>

          <radialGradient id="eyeGradient">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </radialGradient>

          <linearGradient id="mouthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
          </linearGradient>

          <radialGradient id="orbGlow">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
          </radialGradient>

          <radialGradient id="nodeGradient">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </radialGradient>

          <radialGradient id="badgeGradient">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
          </radialGradient>

          <radialGradient id="bgGlow">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
