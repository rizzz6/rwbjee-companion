import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Serif_Bengali, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SmartBreadcrumb from "@/components/ui/SmartBreadcrumb";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from '@next/third-parties/google';
import EasterEggLoader from "@/components/eastereggs/EasterEggLoader";
import { getPayloadClient } from "@/lib/payload-client";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import PreviewBanner from "@/components/PreviewBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoBengali = Noto_Serif_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
});

const notoDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
  description:
    "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
  authors: [{ name: "rizzz6" }],
  creator: "rizzz6",
  publisher: "rwbjee",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.rwbjee.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
    description:
      "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
    url: "https://www.rwbjee.com",
    siteName: "rwbjee",
    images: [
      {
        url: "/assets/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
    description:
      "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
    images: ["/assets/images/og-image.svg"],
    creator: "@rizzz6",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },

  },

  category: "education",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch site settings for announcement banner from Payload
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({
    slug: 'site-settings',
  });

  const announcement = settings?.announcement;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>


      <body className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} ${notoDevanagari.variable} antialiased bg-transparent text-gray-900 dark:text-white`}>
        <Providers>
          <PreviewBanner />
          {/* Announcement Banner */}
          {announcement?.enabled && announcement.message && (
            <AnnouncementBanner
              message={announcement.message}
              linkUrl={announcement.linkUrl || undefined}
              linkText={announcement.linkText || undefined}
              variant={announcement.variant || 'info'}
            />
          )}

          {/* Skip Navigation - Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-md focus:shadow-lg transition-all"
          >
            Skip to main content
          </a>

          <Navbar />
          <SmartBreadcrumb />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
          <EasterEggLoader />

          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        </Providers>
        <GoogleTagManager gtmId="GTM-5789Z287" />
      </body>
    </html>
  );
}