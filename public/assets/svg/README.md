# SVG Assets

This directory contains all SVG graphics used throughout the VeriFi Protocol application.

## Directory Structure

```
/public/assets/svg/
├── verifai-mascot.svg         # Main VerifAI mascot character
├── verification-shield.svg     # Verification shield icon (for badges/status)
└── README.md                   # This file
```

## Assets

### VerifAI Mascot (`verifai-mascot.svg`)
**Purpose:** Main brand mascot and AI assistant avatar

**Features:**
- Cute blob character design
- Animated eyes with blinking
- Oracle antennae with pulsing orbs
- Waving arms with data nodes
- Verification checkmark on belly
- Floating data particles
- Full animation support

**Usage:**
- Chatbot avatar
- Site favicon
- Loading states
- Brand identity

**Component:** `<VerifAIAvatar />`

**Props:**
- `size`: "sm" | "md" | "lg" | "xl"
- `animate`: boolean (default: true)
- `className`: string (optional)

---

### Verification Shield (`verification-shield.svg`)
**Purpose:** Verification status and security indicators

**Features:**
- Shield shape with checkmark
- Animated verification effect
- Oracle connection nodes
- Data stream lines
- Glowing eyes for AI/tech feel

**Usage:**
- Verification badges
- Security indicators
- Trust signals
- Loading animations

**Potential Components:**
- `<VerificationBadge />`
- `<SecurityIndicator />`

---

## Design System

### Color Palette
All SVGs use the VeriFi brand colors:

- **Primary Blue:** `#3B82F6` → `#6366F1`
- **Purple Accent:** `#8B5CF6` → `#A78BFA`
- **Success Green:** `#10B981` → `#34D399`
- **Glow/Light Blue:** `#60A5FA`

### Animation Principles
1. **Smooth transitions** - 1.5s - 3s duration
2. **Staggered delays** - Create flow
3. **Subtle movements** - Not distracting
4. **Purposeful** - Each animation conveys meaning

### Guidelines for New SVGs

When adding new SVG assets:

1. **File Naming:** Use kebab-case (e.g., `market-badge.svg`)
2. **Size:** 200x200 viewBox for consistency
3. **Colors:** Use brand gradients from design system
4. **IDs:** Prefix gradient/def IDs to avoid conflicts
5. **Animation:** Optional but encouraged for brand consistency
6. **Documentation:** Update this README with purpose and usage

### Creating React Components

For reusable SVGs, create a component in `/components`:

```tsx
interface MyIconProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function MyIcon({ size = "md", animate = true, className }: MyIconProps) {
  return (
    <div className={cn(sizeClasses[size], className)}>
      <svg viewBox="0 0 200 200" fill="none">
        {/* SVG content */}
      </svg>
    </div>
  );
}
```

## Future Assets

Potential SVGs to create:

- [ ] Oracle connection indicator
- [ ] Market status badges (HOT, CLOSING, etc.)
- [ ] Trading activity indicators
- [ ] Liquidity pool icons
- [ ] Resolution state icons
- [ ] Achievement badges
- [ ] Social share graphics
- [ ] Loading spinners (brand-specific)
- [ ] Error/success state illustrations

## Resources

- [SVG Animation Guide](https://css-tricks.com/guide-svg-animations-smil/)
- [Gradient Generator](https://cssgradient.io/)
- [OKLCH Color Picker](https://oklch.com/)
