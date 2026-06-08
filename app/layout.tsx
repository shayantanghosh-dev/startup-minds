import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StartupMinds — Where Startups Meet Their Future",
    template: "%s | StartupMinds",
  },
  description:
    "StartupMinds is India's premier startup-investor networking and fundraising platform. Connect with verified investors, get AI-powered insights, and accelerate your startup journey.",
  keywords: ["startup", "investor", "fundraising", "India", "venture capital", "ecosystem"],
  openGraph: {
    type: "website",
    siteName: "StartupMinds",
    title: "StartupMinds — Where Startups Meet Their Future",
    description: "India's premier startup-investor networking and fundraising platform.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
