import type { Metadata } from "next";
import FAQ from '@/components/content/FAQDedicated';

export const metadata: Metadata = {
  title: "FAQ | WBJEE College Predictor",
  description: "Frequently asked questions about WBJEE college prediction, counseling process, tools, and admission requirements. Get answers to common queries about our college predictor and WBJEE 2026.",
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: "FAQ | WBJEE College Predictor",
    description: "Frequently asked questions about WBJEE college prediction, counseling process, tools, and admission requirements.",
    url: "https://www.rwbjee.com/faq",
    images: [
      {
        url: "/assets/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "FAQ - WBJEE College Predictor",
      },
    ],
    type: "website",
  },
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is WBJEE?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "WBJEE stands for West Bengal Joint Entrance Examination. It is a state-level entrance exam for admission to undergraduate engineering, pharmacy, and architecture courses in West Bengal."
                }
              },
              {
                "@type": "Question",
                "name": "Is this the official WBJEE website?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, this is not the official WBJEE website. This site is an independent resource to help students with tools, predictors, and information. For official updates, always refer to wbjeeb.nic.in."
                }
              },
              {
                "@type": "Question",
                "name": "What is the eligibility criteria for WBJEE 2026?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Candidates must have passed (or be appearing in) the 10+2 examination with Physics and Mathematics along with Chemistry/Biology/Biotechnology/Computer Science as compulsory subjects. There are also minimum marks and age requirements. Please check the official brochure for detailed criteria."
                }
              },
              {
                "@type": "Question",
                "name": "How accurate is the rank predictor?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The rank predictor uses previous years' data and statistical models to estimate your probable rank or college. While it provides a good indication, actual results may vary due to changes in exam patterns, competition, and other factors."
                }
              },
              {
                "@type": "Question",
                "name": "Where does the cutoff data come from?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Cutoff data is sourced from official WBJEE counseling releases and participating institutes. We strive to keep the data updated and accurate, but always cross-check with official sources."
                }
              },
              {
                "@type": "Question",
                "name": "What happens during WBJEE counseling?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "During counseling, candidates register, fill in their choices of colleges and branches, and are allotted seats based on their rank, preferences, and seat availability. The process includes document verification and fee payment."
                }
              },
              {
                "@type": "Question",
                "name": "What is the difference between Round 1 and Round 2?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Round 1 is the initial seat allotment. In Round 2, candidates who did not get a seat or wish to upgrade can participate again. Vacant seats from Round 1 are filled in Round 2, and seat upgrades may occur based on preferences and availability."
                }
              }
            ]
          })
        }}
      />
      <FAQ />
    </>
  );
}