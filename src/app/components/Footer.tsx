'use client';

import Link from 'next/link';
import { useSidebar } from '../contexts/SidebarContext';

export default function Footer() {
  const { isSidebarCollapsed } = useSidebar();

  return (
    <footer className={`bg-gray-900 text-white mt-auto relative z-10 transition-all duration-300 ${
      isSidebarCollapsed ? 'md:ml-16' : 'md:ml-48 lg:ml-64'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-3 text-white">EDGAR-JSON API</h3>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Transform SEC EDGAR filings into structured JSON with our developer-friendly API. 
              Perfect for building financial applications, compliance tools, and data analysis.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://github.com/deanshelton913/sec-edgar-parser"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="mailto:support@edgar-json.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email Support"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/api-key" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Get API Key
                </Link>
              </li>
              <li>
                <Link href="/billing" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/usage-stats" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Usage Stats
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Legal & Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="https://www.sec.gov/edgar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  SEC EDGAR Database
                </a>
              </li>
              <li>
                <a
                  href="https://www.sec.gov/developer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  SEC Developer Resources
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Mukilteo Technical Solutions CORP. All rights reserved.
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-400">
              <span>Made with ❤️ for developers</span>
              <span className="hidden sm:inline">•</span>
              <span>Powered by Next.js & Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
