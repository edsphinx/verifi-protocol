"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletSelector } from "./WalletSelector";
import { NotificationBell } from "./notifications/NotificationBell";

const Logo = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="VeriFi Protocol Logo"
    className="transition-transform hover:scale-105"
  >
    <title>VeriFi Protocol</title>
    {/* Checkmark/Verification symbol */}
    <path
      d="M20 55 L40 75 L80 25"
      stroke="hsl(var(--primary))"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Subtle accent line */}
    <path
      d="M25 85 L75 85"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Markets" },
    { href: "/create", label: "Create" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/pools", label: "Liquidity" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo />
            <span className="text-xl font-bold font-sans transition-colors">
              <span className="text-foreground group-hover:text-primary transition-colors">
                Veri
              </span>
              <span className="text-primary">Fi</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="hidden md:block">
              <WalletSelector />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl">
            <nav className="flex flex-col py-4 px-4 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-border/30">
                <WalletSelector />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
