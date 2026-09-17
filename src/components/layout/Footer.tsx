"use client";

import Link from "next/link";
import {
  User,
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  BarChart3,
  Calculator,
  Share2,
  HelpCircle,
  Shield,
  FileText
} from 'lucide-react';
import FooterAazadi from './FooterAazadi';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* TOP SECTION: Brand (Left) + Links (Right) */}
        <div className="flex flex-col lg:flex-row gap-12 mb-12">

          {/* 1. BRAND IDENTITY SECTION (Left Side) */}
          <div className="lg:w-1/3 flex flex-col items-start gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              r/wbjee Companion
            </Link>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              Your complete guide to WBJEE engineering admissions. From rank prediction to college reviews, we help you make informed decisions for your future.
            </p>

            {/* Optional: Social Icons Row */}
            <div className="flex items-center gap-4 mt-2">
              <a href="https://reddit.com/r/wbjee" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#FF4500] transition-colors rounded focus-ring" aria-label="Reddit">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
              </a>
              <a href="https://discord.gg/pTTKPYryDp" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#5865F2] transition-colors rounded focus-ring" aria-label="Discord">
                <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-5 h-5"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c.06-1.48.1-2.94.1-4.39C126.71,46.11,118.41,21.4,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" /></svg>
              </a>
            </div>
          </div>

          {/* 2. LINKS GRID SECTION (Right Side) */}
          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">

            {/* Resources */}
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Resources</h2>
              <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/blog" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded focus-ring px-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Blog</span>
                </Link>
                <Link href="/colleges" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded focus-ring px-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>College List</span>
                </Link>
                <Link href="/timeline" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded focus-ring px-1">
                  <Calendar className="w-4 h-4" />
                  <span>Important Dates</span>
                </Link>
              </div>
            </div>

            {/* Tools */}
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Tools</h2>
              <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/predictor" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <span>Rank Predictor</span>
                </Link>
                <Link href="/marks-calculator" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Calculator className="w-4 h-4" />
                  <span>Marks Calculator</span>
                </Link>
                <Link href="/cutoffs" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>Cutoffs</span>
                </Link>
              </div>
            </div>

            {/* Connect */}
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Connect</h2>
              <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/socials" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Socials</span>
                </Link>
                <a href="https://www.reddit.com/u/rizzz6" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <User className="w-4 h-4" />
                  <span>Contact Me</span>
                </a>
              </div>
            </div>

            {/* Legal */}
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Legal</h2>
              <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/faq" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Link>
                <Link href="/privacy" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Privacy Policy</span>
                </Link>
                <Link href="/disclaimer" className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>Disclaimer</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
              © {new Date().getFullYear()} r/wbjee Companion. Built by{' '}
              <a
                href="https://www.reddit.com/u/rizzz6"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2 text-gray-900 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                u/rizzz6
              </a>
              .
            </div>

            <FooterAazadi />
          </div>
        </div>
      </div>
    </footer>
  );
}