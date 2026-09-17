'use client';

import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, MapPin, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';

interface College {
  _id: string;
  name: string;
  shortName: string;
  slug: { current: string };
  logo?: { url: string };
  location: string;
  type: string;
}

interface CollegeSearchProps {
  colleges: College[];
}

export default function CollegeSearch({ colleges }: CollegeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // ⚡ OPTIMIZATION: Efficient filtering logic with pre-calculated lower-case search term
  const filteredColleges = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    
    return colleges.filter((college) => {
      // 1. Type filter first (flexible matching for Government/Private variations)
      if (filterType !== 'All') {
        const cType = (college.type || '').toLowerCase();
        if (filterType === 'Government') {
          const isGovt = cType.includes('govt') || cType === 'government' || cType === 'university';
          if (!isGovt) return false;
        } else if (filterType === 'Private') {
          const isPrivate = cType.includes('private');
          if (!isPrivate) return false;
        } else if (college.type !== filterType) {
          return false;
        }
      }
      
      // 2. Search filter (if exists)
      if (trimmedSearch) {
        const matchesName = college.name.toLowerCase().includes(trimmedSearch);
        const matchesShortName = college.shortName.toLowerCase().includes(trimmedSearch);
        if (!matchesName && !matchesShortName) return false;
      }
      
      return true;
    });
  }, [colleges, searchTerm, filterType]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search colleges by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['All', 'Government', 'Private'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterType === type
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* College Grid */}
      {filteredColleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college) => (
            <Link
              key={college._id}
              href={`/colleges/${college.slug.current}`}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-red-100 dark:hover:border-red-900/30 block"
            >
              {/* Top: Logo & Type */}
              <div className="flex justify-between items-start mb-4">

                {/* LOGO CONTAINER */}
                {/* FIX: bg-white ensures logo looks correct in dark mode (no dark strips) */}
                <div className="w-12 h-12 relative bg-white rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
                  {college.logo?.url ? (
                    /* FIX: p-1 padding + object-contain for perfect fit */
                    <div className="absolute inset-0 p-1">
                      <Image
                        src={college.logo.url}
                        alt={`${college.name} logo`}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${college.type === 'Government'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                  {college.type === 'Government' ? 'Govt' : college.type === 'Private' ? 'Private' : 'Semi-Govt'}
                </span>
              </div>

              {/* Middle: Name and Location */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {college.name}
                </h2>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {college.location}
                </div>
              </div>

              {/* Bottom: View Profile Button */}
              <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                <span>View Profile</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No colleges found</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}