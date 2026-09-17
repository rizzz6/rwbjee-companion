import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import { FileText, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { getPayloadClient } from '@/lib/payload-client';

export const revalidate = 86400; // 24 hours ISR

interface PayloadMedia {
  url: string;
}

export const metadata: Metadata = {
  title: "WBJEE Prep Blog | Latest Updates & Strategies",
  description: "Essential guides, exam analysis, and strategy tips for every WBJEE aspirant. Stay updated with the latest news and expert advice.",
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: "WBJEE Prep Blog | r/wbjee Companion",
    description: "Expert guides and latest updates for WBJEE aspirants.",
    url: "https://www.rwbjee.com/blog",
    siteName: "rwbjee",
    type: "website",
    images: [
      {
        url: "/assets/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "WBJEE Prep Blog - Expert Guides and Updates",
      },
    ],
  }
};

export default async function BlogPage() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
  });
  
  const posts = res.docs;

  return (
    <div className="bg-white dark:bg-gray-900">
      <PageHero
        title={{ main: 'Latest', accent: 'Updates' }}
        description="Essential guides, exam analysis, and strategy tips for every WBJEE aspirant."
        badge="From the Editor's Desk"
      />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
               const mainImage = post.mainImage as PayloadMedia | null;
               return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {mainImage?.url ? (
                      <Image
                        src={mainImage.url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-gray-800">
                        <FileText className="w-20 h-20 text-red-300 dark:text-red-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="flex flex-col flex-1 p-8">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Recent'}
                      </div>
                      
                      {/* Author display */}
                      {(() => {
                        interface AuthorDoc { name?: string; }
                        const authors = (Array.isArray(post.author) ? post.author : []) as (string | number | AuthorDoc)[];
                        const authorNames = authors
                          .map((a) => (typeof a === 'object' && a !== null ? (a as AuthorDoc).name : null))
                          .filter((name): name is string => typeof name === 'string');
                        const displayAuthor = authorNames.length > 0 ? authorNames.join(', ') : ((post as { authorName?: string }).authorName);
                        
                        return displayAuthor ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <span>{displayAuthor}</span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {post.title}
                    </h2>

                    <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      <span>Read Article</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">No posts published yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Check back soon for updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}