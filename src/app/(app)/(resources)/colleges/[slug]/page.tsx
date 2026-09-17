import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { MapPin, Building2, Calendar, Globe, Landmark, IndianRupee, TrendingUp, BarChart3, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import CutoffTable from '@/components/content/CutoffTable';
import { getPayloadClient } from '@/lib/payload-client';
import {
  getAboutParagraphs,
  normalizeHighlightItems,
  normalizeRecruiterItems,
  renderPlainParagraphsToHtml,
  renderRichTextToHtml,
} from '@/utils/payload-richtext';

export const revalidate = 86400; // 24 hours ISR

interface PayloadMedia {
  url: string;
  width?: number;
  height?: number;
}

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'colleges',
    where: { isVisible: { equals: true } },
    limit: 500,
    pagination: false,
  });
  return res.docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: isDraftMode } = await draftMode();
  const payload = await getPayloadClient();
  
  const res = await payload.find({
    collection: 'colleges',
    where: { 
      slug: { equals: slug },
      ...(isDraftMode ? {} : { isVisible: { equals: true } })
    },
    limit: 1,
    draft: isDraftMode,
  });
  const college = res.docs[0];

  if (!college) {
    return {
      title: 'College Not Found | rwbjee',
      description: 'The requested engineering college could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const logo = college.logo as PayloadMedia | null;
  const seoTitle = `${college.name}: Cutoffs, Fees & Placements | WBJEE 2026`;
  const description = college.seoDescription ||
    `Get quick info on ${college.name} for WBJEE 2026. Explore cutoffs, fee structures, and placement stats.`;

  const ogUrl = new URL('https://www.rwbjee.com/api/og');
  ogUrl.searchParams.set('type', 'college');
  ogUrl.searchParams.set('title', college.name);
  ogUrl.searchParams.set('location', college.location || '');
  if (logo?.url) ogUrl.searchParams.set('image', logo.url);

  return {
    title: seoTitle,
    description,
    alternates: { canonical: `/colleges/${slug}` },
    openGraph: {
      title: `${college.name} - Details | Cutoffs, Placements, Fees & More`,
      description,
      url: `https://www.rwbjee.com/colleges/${slug}`,
      siteName: 'rwbjee',
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: `${college.name} Campus` }],
      type: 'article',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title: seoTitle, description, images: [ogUrl.toString()] },
  };
}

export default async function CollegeProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled: isDraftMode } = await draftMode();
  const payload = await getPayloadClient();

  const collegeRes = await payload.find({
    collection: 'colleges',
    where: { 
      slug: { equals: slug },
      ...(isDraftMode ? {} : { isVisible: { equals: true } })
    },
    limit: 1,
    draft: isDraftMode,
  });
  const college = collegeRes.docs[0];
  if (!college) notFound();

  const cutoffRes = await payload.find({
    collection: 'college_cutoffs',
    where: { college: { equals: college.id } },
    limit: 1,
    draft: isDraftMode,
  });
  const cutoffDoc = cutoffRes.docs[0];
  const cutoffs = (cutoffDoc?.cutoffs || []).map(c => ({
    year: c.year,
    round: c.round || 'Round 1',
    program: c.program,
    quota: c.quota || '',
    category: c.category || 'General',
    seatType: c.seatType || undefined,
    openingRank: c.openingRank ?? 0,
    closingRank: c.closingRank ?? 0,
  }));

  const logo = college.logo as PayloadMedia | null;
  const cover = college.coverImage as PayloadMedia | null;
  const highlights = normalizeHighlightItems(college.highlights).map((item) => item.text);

  // Fetch placement reports for this college
  const placementRes = await payload.find({
    collection: 'college_placement_reports',
    where: { college: { equals: college.id } },
    sort: '-reportYear',
    limit: 1,
    draft: isDraftMode,
  });
  const latestReport = placementRes.docs[0];

  const recruiters = normalizeRecruiterItems(
    latestReport?.topRecruiters,
  ).map((item) => item.name);
  
  interface FeesStats {
    totalCourseFeeAmount?: number;
    semesterFeeAmount?: number;
  }
  const fs = college.feesStats as FeesStats;
  const isValidMoney = (val?: number | null) => typeof val === 'number' && val >= 1000;

  const formatINR = (val: number | null | undefined) => {
    if (!isValidMoney(val)) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val!);
  };


  const overviewHtml = renderRichTextToHtml({
    content: college.overview || college.body,
    fallbackHtml: renderPlainParagraphsToHtml(getAboutParagraphs(college.about)),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="relative h-[300px] md:h-[400px] bg-white dark:bg-gray-900 transition-colors duration-300">
        {cover?.url ? (
          <div className="absolute inset-0 opacity-30 dark:opacity-60 transition-opacity duration-300">
            <Image 
              src={cover.url} 
              fill 
              priority
              sizes="100vw"
              className="object-contain blur-[2px]" 
              alt="Campus" 
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800"></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent dark:from-gray-900 dark:via-transparent dark:to-transparent"></div>

        <div className="container mx-auto px-6 h-full flex flex-col justify-end pb-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 text-left">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-2xl shadow-xl shrink-0 relative overflow-hidden border border-gray-100 dark:border-gray-800">
              {logo?.url ? (
                <div className="absolute inset-0 p-2 flex items-center justify-center">
                  <Image
                    src={logo.url}
                    alt={college.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 80px, 128px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl md:text-3xl font-bold text-gray-400 bg-gray-50">
                  {college.shortName?.[0]}
                </div>
              )}
            </div>

            <div className="flex-1 text-gray-900 dark:text-white w-full">
              <div className="flex flex-wrap justify-start gap-3 mb-3">
                {college.shortName && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {college.shortName}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${college.type && college.type.includes('Govt') ? 'bg-green-700' : 'bg-gray-600'}`}>
                  {college.type}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-3">
                {college.name}
              </h1>

              <div className="flex items-center justify-start text-gray-600 dark:text-gray-300 gap-2 font-medium">
                <MapPin className="w-5 h-5" />
                {college.location}
              </div>
            </div>

            {college.website && (
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-6 py-3 rounded-full font-bold transition-colors mb-2"
              >
                <Globe className="w-5 h-5" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-10 order-2 lg:order-1">
            {overviewHtml && (
              <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-red-600"><Landmark className="w-6 h-6" /></span> About the Institute
                </h2>
                <div
                  className="prose prose-red dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: overviewHtml }}
                />
              </section>
            )}

            {(isValidMoney(fs?.totalCourseFeeAmount) || isValidMoney(fs?.semesterFeeAmount)) && (
              <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="text-red-600"><IndianRupee className="w-6 h-6" /></span> Fee Structure
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {isValidMoney(fs.totalCourseFeeAmount) && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Course Fee</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(fs.totalCourseFeeAmount)}</p>
                    </div>
                  )}
                  {isValidMoney(fs.semesterFeeAmount) && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fee Per Semester</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(fs.semesterFeeAmount)}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {(latestReport?.highestPackageLpa || latestReport?.averagePackageLpa || latestReport?.medianPackageLpa) && (
              <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="text-red-600"><TrendingUp className="w-6 h-6" /></span> Placements & Stats
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  {latestReport?.highestPackageLpa && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                      <p className="text-xs text-green-600 uppercase font-semibold mb-1">Highest Package</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        Rs. {latestReport.highestPackageLpa} LPA
                      </p>
                    </div>
                  )}
                  {latestReport?.averagePackageLpa && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Average Package</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        Rs. {latestReport.averagePackageLpa} LPA
                      </p>
                    </div>
                  )}
                  {latestReport?.medianPackageLpa && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                      <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Median Salary</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        Rs. {latestReport.medianPackageLpa} LPA
                      </p>
                    </div>
                  )}
                </div>

                {recruiters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" /> Top Recruiters
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recruiters.map((recruiter, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                          {recruiter}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {latestReport?.sourceName && (
                  <p className="text-xs text-gray-400 mt-4 italic">Source: {latestReport.sourceName}</p>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                Quick Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Type</p>
                    <p className="text-gray-900 dark:text-gray-200 font-medium">{college.type}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Established</p>
                    <p className="text-gray-900 dark:text-gray-200 font-medium">{college.estYear || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                    <p className="text-gray-900 dark:text-gray-200 font-medium">{college.location}</p>
                  </div>
                </div>
              </div>

              {highlights.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full flex md:hidden items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Visit Website <ArrowRight className="w-4 h-4" />
                </a>
              )}

              <Link
                href="/predictor"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <BarChart3 className="w-5 h-5" />
                Check Admission Probability
              </Link>
            </div>
          </div>
        </div>

        {cutoffs.length > 0 && (
          <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-red-600"><BarChart3 className="w-6 h-6" /></span> Cutoff Trends (WBJEE)
            </h2>

            <CutoffTable cutoffs={cutoffs} />

            <p className="text-sm text-gray-500 mt-4 italic">
              * Data represents Opening & Closing Ranks for various rounds.
            </p>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link
          href="/predictor"
          className="flex items-center justify-center gap-2 w-full bg-red-600 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          Check Admission Probability
        </Link>
      </div>
    </div>
  );
}