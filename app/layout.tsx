import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Header } from "@/components/Header";
import { NotificationProvider } from "@/components/providers/NotificationContext";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { WalletLayer } from "@/components/providers/WalletLayer";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";
import { TappModeProvider } from "@/lib/tapp/context/TappModeContext";
import "@/styles/globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeriFi Protocol | On-Chain Derivatives on Aptos",
  description:
    "Create and trade markets on any verifiable on-chain event, oracle-free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
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
