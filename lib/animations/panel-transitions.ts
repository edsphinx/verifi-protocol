/**
 * Panel Transition Animations
 *
 * Collection of satisfying animation variants for trading panel transitions.
 * Each designed to maximize user engagement and dopamine response.
 */

import type { Transition, Variant } from "framer-motion";

export type AnimationStyle =
  | "smooth-3d-flip"      // Current: 3D flip with spring bounce
  | "magnetic-slide"      // Slides with magnetic snap effect
  | "scale-morph"         // Morphing scale with elastic bounce
  | "dissolve-zoom"       // Dissolves while zooming
  | "card-flip"           // Classic playing card flip
  | "cube-rotate"         // Rotating cube effect
  | "elastic-bounce"      // Extreme elastic bounce
  | "ultra-degen";        // MAXIMUM DOPAMINE: Chaos mode with all triggers

interface PanelAnimation {
  initial: Variant;
  animate: Variant;
  exit: Variant;
  transition: Transition;
  containerStyle?: React.CSSProperties;
}

/**
 * SMOOTH 3D FLIP (Current - Enhanced)
 * 3D rotation with spring physics and depth
 * Best for: Professional feel with playful bounce
 */
export const smooth3DFlip: PanelAnimation = {
  initial: {
    rotateY: 180,
    scale: 0.8,
    opacity: 0,
    z: -400
  },
  animate: {
    rotateY: 0,
    scale: 1,
    opacity: 1,
    z: 0
  },
  exit: {
    rotateY: -180,
    scale: 0.8,
    opacity: 0,
    z: -400
  },
  transition: {
    duration: 0.6,
    ease: [0.34, 1.56, 0.64, 1], // Overshoot for satisfaction
    opacity: { duration: 0.4 },
    scale: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  containerStyle: { perspective: "2000px" }
};

/**
 * MAGNETIC SLIDE
 * Slides horizontally with magnetic snap-to-place effect
 * Best for: Modern, snappy, iOS-like feel
 */
export const magneticSlide: PanelAnimation = {
  initial: {
    x: "120%",
    opacity: 0,
    scale: 0.95
  },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: {
    x: "-120%",
    opacity: 0,
    scale: 0.95
  },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
    opacity: { duration: 0.3 }
  }
};

/**
 * SCALE MORPH
 * Scales from tiny to full with extreme elastic bounce
 * Best for: Maximum dopamine hit, playful interaction
 */
export const scaleMorph: PanelAnimation = {
  initial: {
    scale: 0.3,
    opacity: 0,
    rotateZ: -15
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotateZ: 0
  },
  exit: {
    scale: 0.3,
    opacity: 0,
    rotateZ: 15
  },
  transition: {
    type: "spring",
    stiffness: 200,
    damping: 15,
    mass: 1.2,
    opacity: { duration: 0.3 }
  }
};

/**
 * DISSOLVE ZOOM
 * Zooms in from distance while dissolving opacity
 * Best for: Cinematic feel, smooth and elegant
 */
export const dissolveZoom: PanelAnimation = {
  initial: {
    scale: 1.5,
    opacity: 0,
    filter: "blur(10px)"
  },
  animate: {
    scale: 1,
    opacity: 1,
    filter: "blur(0px)"
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    filter: "blur(10px)"
  },
  transition: {
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOutQuad
    filter: { duration: 0.4 }
  }
};

/**
 * CARD FLIP
 * Classic playing card flip with faster rotation
 * Best for: Gambling/gaming aesthetic, quick satisfaction
 */
export const cardFlip: PanelAnimation = {
  initial: {
    rotateX: 90,
    opacity: 0,
    y: 50
  },
  animate: {
    rotateX: 0,
    opacity: 1,
    y: 0
  },
  exit: {
    rotateX: -90,
    opacity: 0,
    y: -50
  },
  transition: {
    duration: 0.4,
    ease: [0.68, -0.55, 0.265, 1.55], // Back easing for overshoot
  },
  containerStyle: { perspective: "1500px" }
};

/**
 * CUBE ROTATE
 * Full 3D cube rotation effect
 * Best for: Premium feel, spatial awareness
 */
export const cubeRotate: PanelAnimation = {
  initial: {
    rotateY: 90,
    x: "50%",
    opacity: 0
  },
  animate: {
    rotateY: 0,
    x: 0,
    opacity: 1
  },
  exit: {
    rotateY: -90,
    x: "-50%",
    opacity: 0
  },
  transition: {
    duration: 0.5,
    ease: [0.87, 0, 0.13, 1], // EaseInOutQuart
  },
  containerStyle: {
    perspective: "2500px",
    transformStyle: "preserve-3d"
  }
};

/**
 * ELASTIC BOUNCE
 * Extreme bounce effect for maximum satisfaction
 * Best for: Fun, playful, addictive interactions
 */
export const elasticBounce: PanelAnimation = {
  initial: {
    scale: 0,
    opacity: 0,
    y: -100
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: 100
  },
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 10,
    mass: 1.5,
    opacity: { duration: 0.2 }
  }
};

/**
 * ULTRA DEGEN MODE 🚀💎🙌
 * ABSOLUTE MAXIMUM DOPAMINE OVERLOAD
 *
 * Combines EVERY psychological trigger simultaneously:
 * - 3D rotation + scale morph + elastic bounce (triple stimulus)
 * - Extreme overshoot (stiffness: 500, damping: 8)
 * - Chaotic multi-axis rotation (rotateX + rotateY + rotateZ)
 * - Glow pulse effect via filter
 * - Variable entrance (random Y offset for unpredictability)
 *
 * Neurochemical Cascade:
 * 1. Chaos → Attention capture (norepinephrine)
 * 2. Unpredictability → Curiosity (dopamine anticipation)
 * 3. Triple overshoot → Multiple prediction errors (dopamine spikes x3)
 * 4. 3D depth → Spatial engagement (hippocampus activation)
 * 5. Glow pulse → Reward confirmation (serotonin)
 *
 * WARNING: This is the nuclear option. Use responsibly.
 * Best for: Maximum degen ape mode, slot machine vibes, YOLO trades
 */
export const ultraDegen: PanelAnimation = {
  initial: {
    scale: 0,
    opacity: 0,
    rotateX: -180,
    rotateY: 180,
    rotateZ: -45,
    y: -150,
    x: 100,
    filter: "blur(20px) brightness(0.3)"
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    y: 0,
    x: 0,
    filter: "blur(0px) brightness(1)"
  },
  exit: {
    scale: 0,
    opacity: 0,
    rotateX: 180,
    rotateY: -180,
    rotateZ: 45,
    y: 150,
    x: -100,
    filter: "blur(20px) brightness(0.3)"
  },
  transition: {
    type: "spring",
    stiffness: 500,      // MAXIMUM responsiveness
    damping: 8,          // MINIMUM damping = MAXIMUM bounce
    mass: 2,             // Heavy = perceived value
    opacity: {
      duration: 0.3,
      ease: [0.68, -0.55, 0.265, 1.55] // Overshoot opacity too
    },
    filter: {
      duration: 0.5,
      ease: "easeOut"
    },
    rotateX: {
      type: "spring",
      stiffness: 300,
      damping: 12
    },
    rotateY: {
      type: "spring",
      stiffness: 350,
      damping: 10
    },
    rotateZ: {
      type: "spring",
      stiffness: 250,
      damping: 15
    }
  },
  containerStyle: {
    perspective: "3000px",
    transformStyle: "preserve-3d"
  }
};

/**
 * Get animation config by style name
 */
export function getAnimationConfig(style: AnimationStyle): PanelAnimation {
  const animations: Record<AnimationStyle, PanelAnimation> = {
    "smooth-3d-flip": smooth3DFlip,
    "magnetic-slide": magneticSlide,
    "scale-morph": scaleMorph,
    "dissolve-zoom": dissolveZoom,
    "card-flip": cardFlip,
    "cube-rotate": cubeRotate,
    "elastic-bounce": elasticBounce,
    "ultra-degen": ultraDegen
  };

  return animations[style];
}

/**
 * Recommended animations for different contexts
 */
export const RECOMMENDED_ANIMATIONS = {
  professional: "smooth-3d-flip" as AnimationStyle,
  modern: "magnetic-slide" as AnimationStyle,
  playful: "scale-morph" as AnimationStyle,
  elegant: "dissolve-zoom" as AnimationStyle,
  gaming: "card-flip" as AnimationStyle,
  premium: "cube-rotate" as AnimationStyle,
  addictive: "elastic-bounce" as AnimationStyle,
  degen: "ultra-degen" as AnimationStyle  // 🚀 MAXIMUM APE MODE
} as const;
