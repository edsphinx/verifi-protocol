# VeriFi Degenometer - Technical Specification

**Status:** 📋 Planned for Final Dashboard Implementation
**Priority:** Phase 3 (Post-MVP)
**Estimated Effort:** 3-5 days
**Last Updated:** 2025-10-04

---

## Overview

The **VeriFi Degenometer** is a user personalization system that allows traders to customize their entire UX experience on a spectrum from "Boring As Fuck" (institutional) to "ULTRA GIGA DEGEN" (maximum dopamine casino mode).

### Core Concept

A single slider control that dynamically adjusts:
- Animation styles and intensity
- Color schemes and visual effects
- Copywriting and tone of voice
- Notification styles and celebrations
- Sound effects and haptic feedback (future)

```
BAF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ULTRA GIGA DEGEN
 0        1        2        3        4        5
```

---

## Degenometer Levels

### Level 0: BAF (Boring As Fuck)
**Target Audience:** Institutional investors, risk committees, compliance officers

**Characteristics:**
- **Animation:** None (simple fade transitions, duration: 200ms)
- **Colors:** Grayscale palette, minimal contrast
- **Typography:** Professional sans-serif, no bold weights
- **Copy:** Technical language, "Purchase Shares", "Execute Transaction"
- **Notifications:** Minimal, text-only, no emojis
- **Psychology:** Zero emotional manipulation, pure data

**Example UI:**
```
┌─────────────────────────────────────┐
│ Market: USDC Supply Threshold       │
│ Current Price: 0.52 USD             │
│ [ Execute Purchase ]                │
└─────────────────────────────────────┘
```

### Level 1: Professional
**Target Audience:** Finance professionals, quant traders, serious investors

**Characteristics:**
- **Animation:** `smooth-3d-flip` (subtle 3D rotation)
- **Colors:** Corporate blues, professional greens/reds
- **Typography:** Medium weights, clear hierarchy
- **Copy:** Business casual, "Buy Position", "Sell Holdings"
- **Notifications:** Toast with icon, professional tone
- **Psychology:** Competence signaling, trust-building

**Example UI:**
```
┌─────────────────────────────────────┐
│ 📊 Market Analysis                  │
│ YES: 68.4% | NO: 31.6%             │
│ [ Buy Position ]  [ Sell Holdings ] │
└─────────────────────────────────────┘
```

### Level 2: Balanced
**Target Audience:** Regular DeFi users, balanced risk appetite

**Characteristics:**
- **Animation:** `magnetic-slide` (smooth iOS-like)
- **Colors:** Standard DeFi palette (moderate saturation)
- **Typography:** Balanced mix of weights
- **Copy:** Friendly neutral, "Buy", "Sell", "Trade"
- **Notifications:** Standard toast with success/error states
- **Psychology:** Usability-focused, no manipulation

**Example UI:**
```
┌─────────────────────────────────────┐
│ Market Overview                      │
│ YES 68% ━━━━━━━━━━━━━━ NO 32%      │
│ [ Buy ]  [ Sell ]                   │
└─────────────────────────────────────┘
```

### Level 3: Degen
**Target Audience:** Crypto natives, meme coin traders, active speculators

**Characteristics:**
- **Animation:** `elastic-bounce` (satisfying spring physics)
- **Colors:** Vibrant green/red, neon accents
- **Typography:** Bold weights, dramatic scales
- **Copy:** Crypto slang, "APE IN", "SEND IT", "LFG"
- **Notifications:** Animated with emojis, celebratory tone
- **Psychology:** FOMO triggers, social proof, urgency

**Example UI:**
```
┌─────────────────────────────────────┐
│ 🚀 Market is PUMPING                │
│ YES 68% 📈 | NO 32% 📉             │
│ [ 🦍 APE YES ]  [ 📉 SHORT NO ]    │
└─────────────────────────────────────┘
```

### Level 4: ULTRA DEGEN
**Target Audience:** Degens, apes, maximum risk seekers

**Characteristics:**
- **Animation:** `ultra-degen` (triple-axis chaos rotation)
- **Colors:** Pulsating neon, glow effects, high contrast
- **Typography:** Extreme bold, animated scales
- **Copy:** Maximum hype, "YOLO", "WAGMI", "DIAMOND HANDS"
- **Notifications:** Confetti, celebration animations, sound ready
- **Psychology:** All dopamine triggers activated, variable rewards

**Example UI:**
```
┌─────────────────────────────────────┐
│ 💎🙌 WAGMI DETECTED 🚀              │
│ YES 68% 🔥🔥🔥 | NO 32% 💀         │
│ [ 🌙 YOLO YES ]  [ ⚡ DUMP NO ]    │
└─────────────────────────────────────┘
```

### Level 5: ULTRA GIGA DEGEN (Future)
**Target Audience:** Maximum chaos enthusiasts

**Characteristics:**
- **Animation:** ultra-degen + particle systems + screen shake
- **Colors:** RGB rainbow pulse, epilepsy warning needed
- **Typography:** Animated text, glitch effects
- **Copy:** Pure memes, "GM ONLY UP", "SER THIS IS CASINO"
- **Notifications:** Full celebration suite, confetti cannon
- **Sound:** Cash register, whoosh, celebration sfx
- **Haptic:** Vibration patterns on mobile
- **Psychology:** Slot machine experience, maximum addiction

**Example UI:**
```
╔═════════════════════════════════════╗
║ ✨💰 SER THIS IS CASINO 💰✨        ║
║ [PARTICLES] YES 68% 🚀🚀🚀         ║
║ [ 🎰 FULL SEND ] [ 🔥 RUG PULL ]  ║
╚═════════════════════════════════════╝
```

---

## Technical Implementation

### 1. State Management (Zustand)

**File:** `/lib/stores/degenometer.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnimationStyle } from '@/lib/animations/panel-transitions';

export type DegenLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ColorScheme = 'grayscale' | 'corporate' | 'standard' | 'vibrant' | 'neon' | 'chaos';

export type CopyStyle = 'technical' | 'professional' | 'neutral' | 'crypto' | 'degen' | 'meme';

export interface DegenometerConfig {
  animation: AnimationStyle;
  colorScheme: ColorScheme;
  copyStyle: CopyStyle;
  enableSounds: boolean;
  enableHaptics: boolean;
  enableParticles: boolean;
  enableCelebrations: boolean;
}

interface DegenometerStore {
  level: DegenLevel;

  // Actions
  setLevel: (level: DegenLevel) => void;
  increaseLevel: () => void;
  decreaseLevel: () => void;

  // Getters
  getConfig: () => DegenometerConfig;
  getAnimationStyle: () => AnimationStyle;
  getColorScheme: () => ColorScheme;
  getCopyStyle: () => CopyStyle;
}

// Configuration map
const LEVEL_CONFIGS: Record<DegenLevel, DegenometerConfig> = {
  0: { // BAF
    animation: 'smooth-3d-flip',
    colorScheme: 'grayscale',
    copyStyle: 'technical',
    enableSounds: false,
    enableHaptics: false,
    enableParticles: false,
    enableCelebrations: false
  },
  1: { // Professional
    animation: 'smooth-3d-flip',
    colorScheme: 'corporate',
    copyStyle: 'professional',
    enableSounds: false,
    enableHaptics: false,
    enableParticles: false,
    enableCelebrations: false
  },
  2: { // Balanced
    animation: 'magnetic-slide',
    colorScheme: 'standard',
    copyStyle: 'neutral',
    enableSounds: false,
    enableHaptics: false,
    enableParticles: false,
    enableCelebrations: false
  },
  3: { // Degen
    animation: 'elastic-bounce',
    colorScheme: 'vibrant',
    copyStyle: 'crypto',
    enableSounds: false,
    enableHaptics: false,
    enableParticles: false,
    enableCelebrations: true
  },
  4: { // Ultra Degen
    animation: 'ultra-degen',
    colorScheme: 'neon',
    copyStyle: 'degen',
    enableSounds: true,
    enableHaptics: true,
    enableParticles: true,
    enableCelebrations: true
  },
  5: { // Ultra Giga Degen
    animation: 'ultra-degen',
    colorScheme: 'chaos',
    copyStyle: 'meme',
    enableSounds: true,
    enableHaptics: true,
    enableParticles: true,
    enableCelebrations: true
  }
};

export const useDegenometer = create<DegenometerStore>()(
  persist(
    (set, get) => ({
      level: 3, // Default to Degen

      setLevel: (level: DegenLevel) => set({ level }),

      increaseLevel: () => set((state) => ({
        level: Math.min(5, state.level + 1) as DegenLevel
      })),

      decreaseLevel: () => set((state) => ({
        level: Math.max(0, state.level - 1) as DegenLevel
      })),

      getConfig: () => LEVEL_CONFIGS[get().level],

      getAnimationStyle: () => LEVEL_CONFIGS[get().level].animation,

      getColorScheme: () => LEVEL_CONFIGS[get().level].colorScheme,

      getCopyStyle: () => LEVEL_CONFIGS[get().level].copyStyle
    }),
    {
      name: 'verifi-degenometer',
      version: 1
    }
  )
);
```

### 2. Copy Dictionary Service

**File:** `/lib/services/copy-dictionary.service.ts`

```typescript
import type { CopyStyle } from '@/lib/stores/degenometer.store';

interface CopyDictionary {
  // Actions
  buyShares: string;
  sellShares: string;
  confirmTrade: string;

  // Status
  success: string;
  error: string;
  pending: string;

  // Market states
  marketUp: string;
  marketDown: string;

  // Notifications
  tradeSuccess: string;
  tradeError: string;
}

const COPY_DICTIONARIES: Record<CopyStyle, CopyDictionary> = {
  technical: {
    buyShares: 'Purchase Shares',
    sellShares: 'Liquidate Position',
    confirmTrade: 'Execute Transaction',
    success: 'Transaction Completed',
    error: 'Transaction Failed',
    pending: 'Processing Transaction',
    marketUp: 'Price Increase Detected',
    marketDown: 'Price Decrease Detected',
    tradeSuccess: 'Position successfully acquired',
    tradeError: 'Transaction execution failed'
  },

  professional: {
    buyShares: 'Buy Position',
    sellShares: 'Sell Holdings',
    confirmTrade: 'Confirm Trade',
    success: 'Trade Successful',
    error: 'Trade Failed',
    pending: 'Trade Pending',
    marketUp: 'Market Trending Up',
    marketDown: 'Market Trending Down',
    tradeSuccess: 'Your trade was successful',
    tradeError: 'Trade could not be completed'
  },

  neutral: {
    buyShares: 'Buy',
    sellShares: 'Sell',
    confirmTrade: 'Confirm',
    success: 'Success',
    error: 'Error',
    pending: 'Pending',
    marketUp: 'Price Up',
    marketDown: 'Price Down',
    tradeSuccess: 'Trade completed',
    tradeError: 'Trade failed'
  },

  crypto: {
    buyShares: 'Buy Now',
    sellShares: 'Take Profit',
    confirmTrade: 'Send It',
    success: 'LFG! 🚀',
    error: 'Rekt 💀',
    pending: 'Loading...',
    marketUp: 'Pumping 📈',
    marketDown: 'Dumping 📉',
    tradeSuccess: 'Trade successful! LFG 🚀',
    tradeError: 'Trade failed. Try again'
  },

  degen: {
    buyShares: 'APE IN',
    sellShares: 'DUMP IT',
    confirmTrade: 'YOLO',
    success: 'WAGMI 💎🙌',
    error: 'NGMI 💀',
    pending: 'SENDING...',
    marketUp: 'MOONING 🌙',
    marketDown: 'RUGGED 🔥',
    tradeSuccess: 'LETS FUCKING GO! 🚀💎',
    tradeError: 'RIP BAGS 💀'
  },

  meme: {
    buyShares: '🦍 FULL SEND',
    sellShares: '📉 RUG PULL',
    confirmTrade: '🎰 GAMBLE',
    success: 'GM ONLY UP ✨',
    error: 'GN REKT SER 💀',
    pending: 'SER WAIT...',
    marketUp: 'SER WE MOON 🚀🚀🚀',
    marketDown: 'SER RUN 🏃💨',
    tradeSuccess: 'SER YOU ARE GENIUS! 🧠💰',
    tradeError: 'SER THIS IS CASINO 🎰💸'
  }
};

export function getCopyForStyle(style: CopyStyle): CopyDictionary {
  return COPY_DICTIONARIES[style];
}

export function getCopy(key: keyof CopyDictionary, style: CopyStyle): string {
  return COPY_DICTIONARIES[style][key];
}
```

### 3. Color Scheme System

**File:** `/lib/themes/degenometer-themes.ts`

```typescript
import type { ColorScheme } from '@/lib/stores/degenometer.store';

interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
}

export const COLOR_SCHEMES: Record<ColorScheme, ThemeColors> = {
  grayscale: {
    primary: '#6B7280',
    secondary: '#9CA3AF',
    success: '#059669',
    error: '#DC2626',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    accent: '#4B5563'
  },

  corporate: {
    primary: '#2563EB',
    secondary: '#7C3AED',
    success: '#059669',
    error: '#DC2626',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    accent: '#1E40AF'
  },

  standard: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    accent: '#60A5FA'
  },

  vibrant: {
    primary: '#06B6D4',
    secondary: '#A855F7',
    success: '#22C55E',
    error: '#F43F5E',
    background: '#020617',
    surface: '#0F172A',
    text: '#F8FAFC',
    accent: '#38BDF8'
  },

  neon: {
    primary: '#00FF88',
    secondary: '#FF00FF',
    success: '#00FF00',
    error: '#FF0055',
    background: '#000000',
    surface: '#0A0A0A',
    text: '#FFFFFF',
    accent: '#00FFFF'
  },

  chaos: {
    primary: 'linear-gradient(90deg, #FF00FF, #00FFFF, #FF00FF)',
    secondary: 'linear-gradient(90deg, #FFFF00, #FF00FF, #00FFFF)',
    success: '#00FF00',
    error: '#FF0000',
    background: '#000000',
    surface: 'radial-gradient(circle, #1a1a1a, #000000)',
    text: '#FFFFFF',
    accent: 'conic-gradient(from 0deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)'
  }
};

export function applyColorScheme(scheme: ColorScheme) {
  const colors = COLOR_SCHEMES[scheme];
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}
```

### 4. Degenometer UI Component

**File:** `/components/Degenometer.tsx`

```tsx
"use client";

import { useDegenometer } from '@/lib/stores/degenometer.store';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { applyColorScheme } from '@/lib/themes/degenometer-themes';
import { useEffect } from 'react';

const LEVEL_LABELS = [
  { value: 0, label: 'BAF', icon: '📊', description: 'Boring As Fuck' },
  { value: 1, label: 'Pro', icon: '💼', description: 'Professional' },
  { value: 2, label: 'Balanced', icon: '⚖️', description: 'Balanced' },
  { value: 3, label: 'Degen', icon: '🦍', description: 'Degen' },
  { value: 4, label: 'Ultra', icon: '🚀', description: 'Ultra Degen' },
  { value: 5, label: 'Giga', icon: '💎', description: 'Ultra Giga Degen' }
];

export function Degenometer() {
  const { level, setLevel, getConfig } = useDegenometer();
  const config = getConfig();

  useEffect(() => {
    applyColorScheme(config.colorScheme);
  }, [config.colorScheme]);

  const currentLabel = LEVEL_LABELS[level];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>VeriFi Degenometer</span>
          <Badge variant="outline">{currentLabel.icon} {currentLabel.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <div className="text-center space-y-2">
          <div className="text-4xl">{currentLabel.icon}</div>
          <div className="text-xl font-bold">{currentLabel.description}</div>
          <div className="text-sm text-muted-foreground">
            Animation: {config.animation} | Colors: {config.colorScheme}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <Slider
            value={[level]}
            onValueChange={(value) => setLevel(value[0] as any)}
            min={0}
            max={5}
            step={1}
            className="w-full"
          />

          {/* Level Labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {LEVEL_LABELS.map((item) => (
              <button
                key={item.value}
                onClick={() => setLevel(item.value as any)}
                className={`flex flex-col items-center gap-1 transition-opacity ${
                  level === item.value ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm">Celebrations</span>
            <Badge variant={config.enableCelebrations ? 'default' : 'secondary'}>
              {config.enableCelebrations ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sounds</span>
            <Badge variant={config.enableSounds ? 'default' : 'secondary'}>
              {config.enableSounds ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Particles</span>
            <Badge variant={config.enableParticles ? 'default' : 'secondary'}>
              {config.enableParticles ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Haptics</span>
            <Badge variant={config.enableHaptics ? 'default' : 'secondary'}>
              {config.enableHaptics ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Integration with Existing Components

**Update ActionPanel.tsx:**

```typescript
import { useDegenometer } from '@/lib/stores/degenometer.store';
import { getCopy } from '@/lib/services/copy-dictionary.service';

export function ActionPanel({ marketId, dynamicData }: ActionPanelProps) {
  const { getAnimationStyle, getCopyStyle } = useDegenometer();
  const copyStyle = getCopyStyle();

  // Use dynamic animation from Degenometer
  const ANIMATION_STYLE = getAnimationStyle();

  // Use dynamic copy
  const buyLabel = getCopy('buyShares', copyStyle);
  const sellLabel = getCopy('sellShares', copyStyle);

  // ... rest of component
}
```

---

## UX Flow

### 1. First Visit
- User sees onboarding modal
- "Choose Your Vibe" slider presented
- Preview of each level shown
- Selection saved to localStorage

### 2. Settings Access
- Degenometer available in:
  - User Settings page
  - Floating widget (bottom-right corner)
  - Quick toggle in header (icon only)

### 3. Live Preview
- Changes apply immediately (no page reload)
- Smooth transition between levels
- Visual feedback on level change

### 4. Persistence
- Level saved to localStorage
- Synced across tabs
- Optional: Save to user profile (if logged in)

---

## Future Enhancements (Level 5+)

### Sound System
```typescript
// /lib/services/sound.service.ts
const SOUNDS = {
  tradeSuccess: '/sounds/cash-register.mp3',
  tradeFail: '/sounds/error.mp3',
  levelUp: '/sounds/achievement.mp3',
  buttonClick: '/sounds/click.mp3',
  celebration: '/sounds/celebration.mp3'
};

export function playSound(soundKey: keyof typeof SOUNDS) {
  if (!useDegenometer.getState().getConfig().enableSounds) return;

  const audio = new Audio(SOUNDS[soundKey]);
  audio.volume = 0.5;
  audio.play();
}
```

### Particle System
```typescript
// Using react-confetti or canvas-confetti
import Confetti from 'react-confetti';

export function CelebrationParticles() {
  const { getConfig } = useDegenometer();
  const { enableParticles } = getConfig();

  if (!enableParticles) return null;

  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={200}
    />
  );
}
```

### Haptic Feedback
```typescript
// /lib/services/haptic.service.ts
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy') {
  if (!useDegenometer.getState().getConfig().enableHaptics) return;

  if ('vibrate' in navigator) {
    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200]
    };
    navigator.vibrate(patterns[pattern]);
  }
}
```

---

## Implementation Checklist

### Phase 1: Core System (Day 1-2)
- [ ] Create Zustand store (`degenometer.store.ts`)
- [ ] Build Copy Dictionary service
- [ ] Implement Color Scheme system
- [ ] Create Degenometer UI component
- [ ] Add to Settings page

### Phase 2: Integration (Day 2-3)
- [ ] Update ActionPanel with dynamic animations
- [ ] Update all buttons with dynamic copy
- [ ] Apply color schemes globally
- [ ] Add floating widget
- [ ] Test all 6 levels

### Phase 3: Polish (Day 3-4)
- [ ] Onboarding flow for first-time users
- [ ] Transition animations between levels
- [ ] Level preview system
- [ ] A/B testing setup
- [ ] Analytics tracking

### Phase 4: Future Features (Day 4-5)
- [ ] Sound system integration
- [ ] Particle effects (react-confetti)
- [ ] Haptic feedback (mobile)
- [ ] Achievement unlocks
- [ ] Social sharing ("I'm Level 5 Degen!")

---

## Analytics & Metrics

Track the following per Degenometer level:

```typescript
interface DegenometerAnalytics {
  level: DegenLevel;
  avgTradesPerUser: number;
  avgVolumePerTrade: number;
  conversionRate: number;
  sessionDuration: number;
  retentionRate: number;
}
```

**Hypothesis:** Higher Degen levels will show:
- ✅ Increased trades per user (impulsivity)
- ✅ Higher engagement time
- ⚠️ Potentially smaller trade sizes (YOLO culture)
- ✅ Better retention (dopamine addiction)

---

## A/B Testing Strategy

### Test 1: Default Level
- **Control:** Level 2 (Balanced)
- **Variant:** Level 3 (Degen)
- **Metric:** 7-day retention rate

### Test 2: Onboarding
- **Control:** Auto-select Level 2
- **Variant:** Force user to choose
- **Metric:** Completion rate + engagement

### Test 3: Upselling
- **Control:** No prompts
- **Variant:** "Try Level 4 for 24h" notification
- **Metric:** Conversion to higher levels

---

## Accessibility Considerations

### Level 0-1 (BAF/Professional)
- Full WCAG 2.1 AA compliance
- Screen reader optimized
- Keyboard navigation
- No flashing animations

### Level 5 (Giga Degen)
- Add epilepsy warning
- Reduce motion option
- Disable by default for screen readers
- Provide "Calm Mode" escape hatch

---

## Technical Risks & Mitigation

### Risk 1: Performance
**Issue:** Level 5 animations may cause jank
**Mitigation:**
- GPU acceleration via `will-change`
- Throttle particle count on low-end devices
- Lazy load sound files

### Risk 2: User Confusion
**Issue:** Too many options overwhelm users
**Mitigation:**
- Smart defaults (Level 3)
- Onboarding with clear examples
- "Reset to Recommended" button

### Risk 3: Brand Consistency
**Issue:** Level 5 may damage professional perception
**Mitigation:**
- Keep it opt-in only
- Clear labeling ("Entertainment Mode")
- Business mode toggle for screenshots

---

## Success Criteria

**Must Have:**
- [x] 6 distinct levels with unique experiences
- [x] Smooth transitions between levels
- [x] Persistent state across sessions
- [x] Mobile responsive

**Nice to Have:**
- [ ] Sound effects (Level 4+)
- [ ] Particle systems (Level 4+)
- [ ] Haptic feedback (Level 5+)
- [ ] Social sharing

**Stretch Goals:**
- [ ] Custom level creation
- [ ] Community-voted level presets
- [ ] Season-specific themes
- [ ] NFT avatar integration per level

---

## References

- [UX_PSYCHOLOGY_RESEARCH.md](/UX_PSYCHOLOGY_RESEARCH.md) - Scientific backing
- [DEGEN_UX_PLAYBOOK.md](/DEGEN_UX_PLAYBOOK.md) - Internal strategy
- [panel-transitions.ts](/lib/animations/panel-transitions.ts) - Animation library
- [market-psychology.service.ts](/lib/services/market-psychology.service.ts) - Psychology engine

---

**Next Steps:**
1. Get stakeholder approval
2. Finalize design mockups per level
3. Schedule implementation sprint
4. Prepare A/B testing infrastructure
5. Launch with analytics tracking

**Status:** Ready for implementation post-MVP ✅
