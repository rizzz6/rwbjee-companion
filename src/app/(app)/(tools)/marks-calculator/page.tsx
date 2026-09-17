import type { Metadata } from 'next'
import MarksCalculatorClient from './MarksCalculatorClient'
import FAQWidget from '@/components/content/FAQWidget'

// Page-specific metadata for SEO
export const metadata: Metadata = {
  title: 'WBJEE Marks Calculator 2026 | Calculate Score & Check Rank Estimation',
  description: 'Instantly calculate your WBJEE 2026 score by uploading your response sheet PDF or pasting your answers. View category-wise marks and compare with the state-wide leaderboard.',
  alternates: {
    canonical: '/marks-calculator',
  },
  openGraph: {
    title: 'WBJEE Marks Calculator 2026 | Calculate Score & Check Rank Estimation',
    description: 'Instantly calculate your WBJEE 2026 score by uploading your response sheet PDF or pasting your answers. View category-wise marks and compare with the state-wide leaderboard.',
    url: 'https://www.rwbjee.com/marks-calculator',
    siteName: 'rwbjee',
    images: [
      {
        url: '/assets/tools/marks-calculator-og.png',
        width: 1200,
        height: 630,
        alt: 'WBJEE 2026 Marks Calculator - Calculate score and leaderboard comparison',
      },
    ],
    type: 'website',
  },
}

const calculatorFAQData = [
  {
    q: 'How does the WBJEE Marks Calculator work?',
    a: 'You can upload your official response sheet PDF (downloaded from the WBJEE Candidate Portal) or copy-paste your response table. The tool parses your answers and automatically evaluates them against the official answer keys to calculate your marks.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes! Your responses are parsed entirely in your browser. When submitting to the leaderboard, your application number is securely hashed (using SHA-256) on the server. Your plain text application number is never stored, maintaining absolute anonymity.',
  },
  {
    q: 'What are the marking rules for WBJEE?',
    a: 'WBJEE has three categories: Category 1 (+1 mark, -0.25 negative), Category 2 (+2 marks, -0.5 negative), and Category 3 (+2 marks max, multiple select, partial scoring based on correct answers, and 0 marks if any incorrect answer is marked). The calculator evaluates according to these exact guidelines.',
  },
  {
    q: 'What if the calculator fails to read my PDF?',
    a: 'Most PDFs downloaded directly from the official portal have a text layer that the calculator parses in milliseconds. If your PDF is scanned or lacks a text layer, you can use the Copy-Paste method by copying the response table from the portal and pasting it here.',
  },
  {
    q: 'Can I update my score on the leaderboard?',
    a: 'Yes! If you submit your score again with the same application number, your record is automatically updated with your latest answers and score, preventing duplicate entries.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': calculatorFAQData.map(item => ({
    '@type': 'Question',
    'name': item.q,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': item.a,
    },
  })),
}

export default function MarksCalculatorPage() {
  return (
    <>
      {/* FAQ Schema for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <MarksCalculatorClient />

      <section className="bg-white dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <FAQWidget data={calculatorFAQData} title="Frequently Asked Questions" />
        </div>
      </section>
    </>
  )
}
