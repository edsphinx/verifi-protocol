import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { NotificationProvider } from "@/components/providers/NotificationContext";
import { WalletLayer } from "@/components/providers/WalletLayer";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SplashScreen } from "@/components/ui/splash-screen";
import { Toaster } from "@/components/ui/sonner";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";
import { TappModeProvider } from "@/lib/tapp/context/TappModeContext";
import "@/styles/globals.css";

// Inter: Clean, modern sans-serif for UI text
// Used by: Stripe, GitHub, Vercel - professional & readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono: Technical monospace for numbers/code
// Perfect for prices, balances, addresses
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Space Grotesk: Modern AI/tech aesthetic for chat
// Used by: AI tools, modern tech products - futuristic feel
const spaceGrotesk = Space_Grotesk({
  variable: "--font-chat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "VeriFi Protocol | On-Chain Derivatives on Aptos",
  description: "Create and trade markets on any verifiable on-chain event, oracle-free.",
  icons: {
    icon: "/assets/svg/verifai-mascot.svg",
    apple: "/assets/svg/verifai-mascot.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SplashScreen />
          <WalletLayer>
            <ReactQueryProvider>
              <NotificationProvider>
                <TappModeProvider>
                  <Header />
                  {children}
                  <SpeedInsights />
                  <WrongNetworkAlert />
                  <Toaster richColors position="bottom-right" />
                </TappModeProvider>
              </NotificationProvider>
            </ReactQueryProvider>
          </WalletLayer>
        </ThemeProvider>
      </body>
    </html>
  );
}
