export const revalidate = 86400; // 24 hours ISR

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FeaturedColleges from "@/components/features/FeaturedColleges";
import { getPayloadClient } from '@/lib/payload-client';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const ImportantDates = dynamic(() => import('@/components/features/ImportantDates'));
const HowItWorks = dynamic(() => import('@/components/features/HowItWorks'));
const JoinCommunity = dynamic(() => import('@/components/content/JoinCommunity'));
const FAQWidget = dynamic(() => import('@/components/content/FAQWidget'));

export const metadata: Metadata = {
  title: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
  description: "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
  openGraph: {
    title: "rwbjee | WBJEE Companion | Resources, Colleges & Community",
    description: "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
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
};

// Define Homepage FAQ Data
const homeFAQData = [
  {
    q: "Is this the official WBJEE site?",
    a: (
      <>
        No, this is a free community resource. For official updates, always visit{" "}
        <a href="https://wbjeeb.nic.in/" target="_blank" rel="noopener noreferrer" className="text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300">wbjeeb.nic.in</a>.
      </>
    ),
  },
  {
    q: "How accurate is the predictor?",
    a: "It uses previous years' cutoff data (2023-2024) to estimate chances. While highly accurate for trends, actual cutoffs vary every year.",
  },
  {
    q: "Is the college data up to date?",
    a: "Yes, we have updated the fees and placement stats for the 2026-2027 session based on the latest available reports.",
  },
];


{/* ... Hero, HowItWorks, ImportantDates, FeaturedColleges ... */ }


// --- Components ---

function Hero() {
  return (
    <section id="home" className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white to-white dark:from-transparent dark:via-gray-900 dark:to-gray-900" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900" />
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">

          {/* ⚡️ OPTIMIZED: Static class list. No animation. 
              Lighthouse will see this instantly. */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            WBJEE College Predictor – Instantly See Your College Options
          </h1>

          {/* ✨ ANIMATED: This fades in 200ms later. 
              Since it's not the LCP element, it doesn't hurt your score! */}
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-400 animate-fade-in-up animation-delay-200">
            Instantly discover the engineering and pharmacy colleges you can get into based on your WBJEE 2026 rank using our <Link href="/predictor" className="text-red-600 underline hover:text-red-800">College Predictor</Link>.
          </p>


          <div className="mt-8 animate-fade-in-up animation-delay-400">
            <Link
              href="/predictor"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white font-semibold shadow-md hover:bg-red-700 active:bg-red-800 transition-colors border-2 border-red-700 hover:border-red-800"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Predict My College Now</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

// 3. New Async Component: Handles data fetching separately
async function FeaturedCollegesSection() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'colleges',
    where: {
      and: [
        { priority: { equals: 1 } },
        { isVisible: { equals: true } },
      ],
    },
    sort: 'name',
    limit: 4,
  });

  // Map Payload docs to the shape FeaturedColleges component expects
  const colleges = res.docs.map((doc) => ({
    _id: String(doc.id),
    name: doc.name,
    slug: { current: doc.slug },
    logo: doc.logo && typeof doc.logo === 'object' && 'url' in doc.logo
      ? { url: (doc.logo as { url: string }).url }
      : undefined,
    location: doc.location || '',
    shortName: doc.shortName || '',
  }));

  return <FeaturedColleges colleges={colleges} />;
}

// 4. Loading State for the colleges (prevents layout shift)
function FeaturedCollegesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-80 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}



// --- Main Page ---

export default function Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* HERO LOADS INSTANTLY NOW (No 'await' blocking it) */}
      <Hero />

      <HowItWorks />

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20 md:space-y-24">
        <ImportantDates
          limit={3}
          showViewAll={true}
        />

        {/* 5. Suspense Boundary: This loads in background while user reads the Hero.
            Reverted to Suspense as bundling it delayed LCP to 3.2s due to contention.
            Streaming it achieves ~2.7s LCP. */}
        <Suspense fallback={<FeaturedCollegesSkeleton />}>
          <FeaturedCollegesSection />
        </Suspense>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          <div className="w-full">
            <FAQWidget
              data={homeFAQData}
              footer={
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                >
                  View All FAQs <span aria-hidden="true">→</span>
                </Link>
              }
            />
          </div>
          <div className="w-full sticky top-24">
            <Suspense fallback={<div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700" />}>
              <JoinCommunity showHeader={true} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* SEO Data (Kept as is) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is this the official WBJEE site?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, this is not the official WBJEE website. For official information, visit wbjeeb.nic.in."
                }
              },
              {
                "@type": "Question",
                "name": "How accurate is the predictor?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The predictor uses previous years' data to estimate your probable rank or college. Actual results may vary. Use it as a guide, not a guarantee."
                }
              }
            ]
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "rwbjee",
            "alternateName": "r/wbjee Companion",
            "url": "https://www.rwbjee.com",
            "logo": "https://www.rwbjee.com/assets/images/og-image.svg",
            "description": "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission.",
            "founder": {
              "@type": "Person",
              "name": "rizzz6",
              "url": "https://reddit.com/u/rizzz6"
            },
            "sameAs": [
              "https://www.reddit.com/r/wbjee/",
              "https://discord.gg/pTTKPYryDp",
              "https://reddit.com/u/rizzz6"
            ]
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "rwbjee",
            "url": "https://www.rwbjee.com",
            "description": "Your guide for WBJEE 2026. Free college Predictor, dates, cutoffs, rank analysis & exam resources to simplify your journey from prep to admission."
          })
        }}
      />
    </div>
  );
}