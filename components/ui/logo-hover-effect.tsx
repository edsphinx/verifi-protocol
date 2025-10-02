"use client";
import { motion } from "framer-motion"; // Asegúrate de usar framer-motion
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const LogoHoverEffect = ({
  text,
  className,
  duration,
}: {
  text: string;
  className?: string;
  duration?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== 0 && cursor.y !== 0) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  return (
    // 1. SVG ahora es más flexible, se adapta al tamaño del contenedor padre
    <svg
      ref={svgRef}
      viewBox="0 0 200 50" // viewBox ajustado para un texto más típico
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none w-auto h-8", className)} // Permite pasar clases para tamaño, etc.
    >
      <title>VeriFi Protocol Logo</title>
      <defs>
        {/* Usando colores de tu tema para el gradiente */}
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="200"
          y2="50"
        >
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          cx={maskPosition.cx}
          cy={maskPosition.cy}
          r={hovered ? "30%" : "0%"} // El radio del efecto crece al hacer hover
          gradientUnits="userSpaceOnUse"
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* 2. NUEVA CAPA: El texto de relleno sólido */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className={cn("font-heading font-bold fill-foreground", className)}
      >
        {text}
      </text>

      {/* Capa del texto con gradiente, revelado por la máscara */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#textGradient)" // Usamos fill para el color, no stroke
        mask="url(#textMask)"
        className={cn("font-heading font-bold", className)} // 3. Usando la fuente del proyecto
      >
        {text}
      </text>
    </svg>
  );
};
