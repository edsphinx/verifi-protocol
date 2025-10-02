"use client";

import {
  PlusCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { LogoHoverEffect } from "@/components/ui/logo-hover-effect";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="hidden sm:inline-block">
            <LogoHoverEffect text="VeriFi" className="text-5xl" />
          </span>
        </Link>

        {/* Main Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Markets */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Markets</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <TrendingUp className="h-6 w-6" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Browse Markets
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Explore all active prediction markets and trade on
                          verifiable on-chain events
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/create" title="Create Market">
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>
                        Launch a new prediction market on any verifiable data
                      </span>
                    </div>
                  </ListItem>
                  <ListItem href="/portfolio" title="My Portfolio">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>View your positions, history, and winnings</span>
                    </div>
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Liquidity */}
            <NavigationMenuItem>
              <Link href="/pools" className={navigationMenuTriggerStyle()}>
                Liquidity
              </Link>
            </NavigationMenuItem>

            {/* Protocol Status */}
            <NavigationMenuItem>
              <Link href="/status" className={navigationMenuTriggerStyle()}>
                Status
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Navigation - Simple Links */}
        <nav className="flex md:hidden items-center space-x-4 text-sm font-medium">
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
