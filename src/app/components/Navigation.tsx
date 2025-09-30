'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GoogleLoginButton from './GoogleLoginButton';
import { useSidebar } from '../contexts/SidebarContext';

interface UserInfo {
  userId: string;
  email: string;
  name: string;
}

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const pathname = usePathname();

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUserInfo(data.user);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUserInfo(null);
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Header - Always visible on both mobile and desktop */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-gray-900">
              EDGAR-JSON API
            </Link>

            {/* Desktop Authentication Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 max-w-32 truncate" title={userInfo?.email}>
                    {userInfo?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <GoogleLoginButton />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-4 bg-white relative z-50">
            <div className="flex flex-col space-y-4">
              {/* Home Link */}
              <Link 
                href="/" 
                className={`px-2 py-1 transition-all duration-200 ${isActive('/') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link 
                    href="/api-key" 
                    className={`px-2 py-1 transition-all duration-200 ${isActive('/api-key') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Api Key
                  </Link>
                  <Link 
                    href="/usage-stats" 
                    className={`px-2 py-1 transition-all duration-200 ${isActive('/usage-stats') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Usage Stats
                  </Link>
                  <Link 
                    href="/billing" 
                    className={`px-2 py-1 transition-all duration-200 ${isActive('/billing') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Billing
                  </Link>
                </>
              )}
              <Link 
                href="/support" 
                className={`px-2 py-1 transition-all duration-200 ${isActive('/support') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </Link>
              <Link 
                href="/terms" 
                className={`px-2 py-1 transition-all duration-200 ${isActive('/terms') ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Terms
              </Link>
              
              {/* Mobile Authentication Section */}
              <div className="pt-4 border-t border-gray-200">
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-2"></div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-2 py-1">
                      <span className="text-sm text-gray-700" title={userInfo?.email}>
                        {userInfo?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="px-2">
                    <GoogleLoginButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Desktop Sidebar - Only visible on desktop */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:top-0 md:bottom-0 md:left-0 md:bg-white md:border-r md:border-gray-200 md:shadow-lg transition-all duration-300 z-40 ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-48 lg:w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <Link href="/" className="text-xl font-bold text-gray-900 truncate">
                EDGAR-JSON API
              </Link>
            )}
            {isSidebarCollapsed && (
              <Link href="/" className="text-xl font-bold text-gray-900" title="EDGAR-JSON API">
                E
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-grow pt-8 pb-4 overflow-y-auto">
          {/* Sidebar Toggle Button */}
          <div className={`flex items-center flex-shrink-0 px-4 mb-4 ${isSidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2 space-y-1">
            {/* Home Link */}
            <Link
              href="/"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive('/')
                  ? 'bg-blue-50 text-blue-700 border border-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
              }`}
              title={isSidebarCollapsed ? "Home" : ""}
            >
              <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!isSidebarCollapsed && <span className="transition-colors duration-200">Home</span>}
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/api-key"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive('/api-key')
                      ? 'bg-blue-50 text-blue-700 border border-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  title={isSidebarCollapsed ? "Api Key" : ""}
                >
                  <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/api-key') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {!isSidebarCollapsed && <span className="transition-colors duration-200">Api Key</span>}
                </Link>

                <Link
                  href="/usage-stats"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive('/usage-stats')
                      ? 'bg-blue-50 text-blue-700 border border-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  title={isSidebarCollapsed ? "Usage Stats" : ""}
                >
                  <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/usage-stats') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {!isSidebarCollapsed && <span className="transition-colors duration-200">Usage Stats</span>}
                </Link>

                <Link
                  href="/billing"
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive('/billing')
                      ? 'bg-blue-50 text-blue-700 border border-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  title={isSidebarCollapsed ? "Billing" : ""}
                >
                  <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/billing') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {!isSidebarCollapsed && <span className="transition-colors duration-200">Billing</span>}
                </Link>
              </>
            )}

            <Link
              href="/support"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive('/support')
                  ? 'bg-blue-50 text-blue-700 border border-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
              }`}
              title={isSidebarCollapsed ? "Support" : ""}
            >
              <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/support') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!isSidebarCollapsed && <span className="transition-colors duration-200">Support</span>}
            </Link>

            <Link
              href="/terms"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive('/terms')
                  ? 'bg-blue-50 text-blue-700 border border-blue-400'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
              }`}
              title={isSidebarCollapsed ? "Terms" : ""}
            >
              <svg className={`h-5 w-5 transition-colors duration-200 ${isActive('/terms') ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'} ${isSidebarCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {!isSidebarCollapsed && <span className="transition-colors duration-200">Terms</span>}
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
}



