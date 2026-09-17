import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, MapPin } from 'lucide-react';

interface College {
  _id: string;
  name: string;
  slug: { current: string };
  logo?: { url: string };
  location: string;
  shortName?: string;
}

export default function FeaturedColleges({ colleges }: { colleges: College[] }) {
  if (!colleges || colleges.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* HEADER ROW */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Featured Colleges
          </h2>
          <Link
            href="/colleges"
            className="text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 transition-colors"
          >
            View Directory <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {colleges.map((col) => (
            <Link
              key={col._id}
              href={`/colleges/${col.slug.current}`}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-red-100 dark:hover:border-red-900/30 transition-all duration-300 w-full"
            >
              {/* LOGO CONTAINER */}
              <div className="w-20 h-20 mb-4 relative flex items-center justify-center bg-white rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {col.logo?.url ? (
                  <div className="absolute inset-0 p-2">
                    <Image
                      src={col.logo.url}
                      alt={col.shortName || col.name}
                      fill
                      sizes="(max-width: 640px) 80px, (max-width: 768px) 40vw, 80px"
                      className="object-contain"
                      priority={true}
                    />
                  </div>
                ) : (
                  <GraduationCap className="w-10 h-10 text-gray-400" />
                )}
              </div>

              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {col.shortName || col.name}
              </h3>

              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-auto font-medium">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{col.location}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}