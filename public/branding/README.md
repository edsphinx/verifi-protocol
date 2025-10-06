# VeriFi Protocol - Branding Assets

This directory contains all branding assets for VeriFi Protocol and our integration partners.

## Directory Structure

```
branding/
├── verifi/           # VeriFi Protocol brand assets
├── partners/         # Partner logos (Tapp Exchange, Nodit, etc.)
├── blockchain/       # Blockchain network logos (Aptos, etc.)
└── README.md
```

## Usage Guidelines

### VeriFi Assets
- **Location:** `public/branding/verifi/`
- **Files:**
  - `verifai-mascot.svg` - VeriFi mascot character
  - `verification-shield.svg` - Shield/checkmark logo
- **Usage:** Internal branding, no restrictions

### Partner Assets

#### Tapp Exchange
- **Location:** `public/branding/partners/TAPP_LOGO.png`, `TAPP_LOGO_2.png`
- **Brand Guide:** https://tapp-exchange.gitbook.io/tapp-exchange/brand-and-security/brand-guide
- **Attribution Required:** Yes - "Powered by Tapp Exchange"
- **Restrictions:**
  - ✅ Can mention products and link to platform
  - ✅ Can use for partnership announcements
  - ❌ Cannot integrate into our logo or branding
  - ❌ Cannot modify colors or arrangement
  - ❌ Cannot abbreviate wordmark

#### Nodit
- **Location:** `public/branding/partners/` (to be added)
- **Attribution Required:** Yes - "Data by Nodit" or "Powered by Nodit"
- **Usage:** Data/analytics sections, intelligence dashboard

### Blockchain Networks

#### Aptos
- **Location:** `public/branding/blockchain/` (to be added)
- **Usage:** Network indicators, wallet connections
- **Attribution:** Display network name with logo

## Components

### PoweredByBadge
- **Path:** `components/branding/PoweredByBadge.tsx`
- **Purpose:** Standardized partner attribution badges
- **Variants:**
  - `minimal` - Small inline badge
  - `default` - Standard with logo and link
  - `full` - Card-style with description

## Adding New Partner Assets

1. Download official logos from partner brand guide
2. Place in `public/branding/partners/[partner-name]/`
3. Update this README with usage guidelines
4. Add configuration to `PoweredByBadge.tsx` if needed
5. Ensure attribution follows partner's brand guidelines

## Contact

For branding questions or partnership inquiries, reach out to the VeriFi team.
