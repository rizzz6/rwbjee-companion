import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | WBJEE College Predictor",
  description: "Read our privacy policy for the WBJEE College Predictor tool. Learn how we collect, use, and protect your data when using our college prediction service.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: "Privacy Policy | WBJEE College Predictor",
    description: "Read our privacy policy for the WBJEE College Predictor tool. Learn how we collect, use, and protect your data.",
    url: "https://www.rwbjee.com/privacy",
    images: [
      {
        url: "/assets/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Privacy Policy - WBJEE College Predictor",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | WBJEE College Predictor",
    description: "Read our privacy policy for the WBJEE College Predictor tool.",
    images: ["/assets/images/og-image.svg"],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <h1 className="text-3xl font-bold mb-3 flex items-center gap-3 text-gray-900 dark:text-white">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            <span>Privacy Policy</span>
          </h1>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Last updated:</strong> December 27, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong>r/wbjee companion</strong> (&quot;us,&quot; &quot;we,&quot; or &quot;our&quot;) operates the <strong>rwbjee.com</strong> website (the &quot;Service&quot;). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Information We Collect
          </h2>
          <p className="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            We may collect the following types of information:
          </p>
          <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong>Non-Personal Data:</strong> Like most website operators, we may collect information that your browser sends whenever you visit our Service. This may include your browser type, IP address, the pages you visit, and other diagnostic data, which is used for analytics.
          </p>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            <strong>Personal Data:</strong> We only collect personally identifiable information (like your name or email address) when you voluntarily provide it to us, for example, by using a contact form. You are not required to provide personal information to browse this site.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            2. Use of Cookies
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            A cookie is a small file placed on your device. We may use cookies to track activity on our Service and hold certain information. This helps us analyze web traffic and improve our website. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            3. How We Use Your Information
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            We use the collected data for various purposes: to provide and maintain our Service, to improve user experience, to monitor usage and prevent abuse, and to respond to your inquiries.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            4. Data Sharing and Disclosure
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            We do not sell, trade, or rent your personal identification information to others. We will not disclose your personal data unless required to do so by law.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            5. Data Security
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            6. Children&apos;s Privacy
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            Our Service is intended for students, some of whom may be under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us so we can take appropriate action.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            7. Links to Other Websites
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            Our Service may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party&apos;s site. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            8. Changes to This Privacy Policy
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>

          <h2 className="text-xl font-bold mt-10 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            9. Contact Us
          </h2>
          <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us by email: <strong>rizzz6v@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}