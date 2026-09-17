import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { getPayloadClient } from '@/lib/payload-client';
import { renderRichTextToHtml } from '@/utils/payload-richtext';

export const revalidate = 86400; // 24 hours ISR

interface PayloadMedia {
  url: string;
}

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 500,
    pagination: false,
  });
  return res.docs.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
  });
  const post = res.docs[0];

  if (!post) {
    return { title: 'Post Not Found', robots: { index: false } };
  }

  const mainImage = post.mainImage as PayloadMedia | null;
  const description = post.excerpt || post.title;

  const ogUrl = new URL('https://www.rwbjee.com/api/og');
  ogUrl.searchParams.set('type', 'post');
  ogUrl.searchParams.set('title', post.title);
  if (mainImage?.url) ogUrl.searchParams.set('image', mainImage.url);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
  });
  const post = res.docs[0];

  if (!post) notFound();

  const mainImage = post.mainImage as PayloadMedia | null;
  
  // Handle multiple authors
  interface AuthorDoc {
    name?: string;
  }
  
  let authorNames: string[] = [];
  if (Array.isArray(post.author)) {
    authorNames = post.author
      .map((a) => (typeof a === 'object' && a !== null ? (a as AuthorDoc).name : null))
      .filter((name): name is string => !!name);
  } else if (post.author && typeof post.author === 'object') {
    const name = (post.author as AuthorDoc).name;
    if (name) authorNames.push(name);
  }
  
  const extendedPost = post as typeof post & { authorName?: string | null; bodyHtml?: string | null };
  const displayAuthor = authorNames.length > 0 
    ? authorNames.join(', ') 
    : (extendedPost.authorName as string | undefined) || 'rwbjee Team';

  const bodyHtml = renderRichTextToHtml({
    content: post.body,
    fallbackHtml: typeof extendedPost.bodyHtml === 'string' ? extendedPost.bodyHtml : null,
  });

  return (
    <article className="bg-white dark:bg-gray-900 pb-8 relative selection:bg-red-100 selection:text-red-900 dark:selection:bg-red-900/30 dark:selection:text-red-100">
      <div className="absolute inset-x-0 top-0 h-[600px] -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/60 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.3]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent" />
      </div>

      <div className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-16 z-20 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-12 md:pt-16">
        <header className="mb-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm mb-6">
            {post.publishedAt && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm">
                <Calendar className="w-4 h-4 text-red-500" />
                <time dateTime={post.publishedAt}>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</time>
              </div>
            )}
            {displayAuthor && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm">
                <User className="w-4 h-4 text-blue-500" />
                <span>{displayAuthor}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight mb-6 drop-shadow-sm">
            {post.title}
          </h1>
        </header>

        {mainImage?.url && (
          <div className="relative aspect-video w-full mb-12 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10">
            <Image
              src={mainImage.url}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
            />
          </div>
        )}

        <div
          className="prose prose-lg md:prose-xl dark:prose-invert max-w-none prose-red prose-headings:font-bold prose-a:text-red-600 dark:prose-a:text-red-400"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />

        <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 text-sm font-medium">
            <Share2 className="w-4 h-4" />
            Found this helpful? Share it with fellow aspirants!
          </div>
        </div>
      </div>
    </article>
  );
}