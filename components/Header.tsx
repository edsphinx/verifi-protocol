"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoHoverEffect } from "@/components/ui/logo-hover-effect";
import { cn } from "@/lib/utils";
import { WalletSelector } from "./WalletSelector";
import { NotificationBell } from "./notifications/NotificationBell";

const Logo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="VeriFi Protocol Logo"
  >
    <title>VeriFi Protocol Logo</title>
    <path
      d="M20 80L50 20L80 80L20 80Z"
      stroke="hsl(var(--primary))"
      strokeWidth="10"
      strokeLinejoin="round"
    />
    <path
      d="M35 80L50 50L65 80"
      stroke="hsl(var(--foreground))"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <Logo />
          <span className="hidden sm:inline-block">
            <LogoHoverEffect text="VeriFi" className="text-5xl" />
          </span>
        </Link>

        {/* Main Navigation - Clean Direct Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Markets
          </Link>
          <Link
            href="/create"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/create" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Create
          </Link>
          <Link
            href="/portfolio"
            className={cn(
              "transition-colors hover:text-foreground",
              pathname === "/portfolio"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Portfolio
          </Link>
          <Link
            href="/pools"
            className={cn(
              "hidden md:block transition-colors hover:text-foreground",
              pathname === "/pools"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Liquidity
          </Link>
          <Link
            href="/status"
            className={cn(
              "hidden md:block transition-colors hover:text-foreground",
              pathname === "/status"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Status
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <NotificationBell />
          <WalletSelector />
        </div>
      </div>
    </header>
  );
}
