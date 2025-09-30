import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/WalletProvider";
import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <ReactQueryProvider>
              <Header />
              {children}
              <WrongNetworkAlert />
              <Toaster richColors position="bottom-right" />
            </ReactQueryProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
