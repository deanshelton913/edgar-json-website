'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GoogleLoginButton from './GoogleLoginButton';

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
    <nav className="p-4 bg-white shadow-md">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          EDGAR-JSON API
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="space-x-6">
            <Link href="/api-key" className="text-gray-700 hover:text-gray-900">
              Api Key
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/usage-stats" className="text-gray-700 hover:text-gray-900">
                  Usage Stats
                </Link>
                <Link href="/billing" className="text-gray-700 hover:text-gray-900">
                  Billing
                </Link>
              </>
            )}
            <Link href="/docs" className="text-gray-700 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/terms" className="text-gray-700 hover:text-gray-900">
              Terms
            </Link>
          </div>
          
          {/* Desktop Authentication Section */}
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 max-w-32 truncate" title={userInfo?.email}>
                {userInfo?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
          className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-50 border border-gray-300"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="flex flex-col space-y-4 pt-4">
            <Link 
              href="/api-key" 
              className="text-gray-700 hover:text-gray-900 px-2 py-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Api Key
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  href="/usage-stats" 
                  className="text-gray-700 hover:text-gray-900 px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Usage Stats
                </Link>
                <Link 
                  href="/billing" 
                  className="text-gray-700 hover:text-gray-900 px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Billing
                </Link>
              </>
            )}
            <Link 
              href="/docs" 
              className="text-gray-700 hover:text-gray-900 px-2 py-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-700 hover:text-gray-900 px-2 py-1"
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
                    className="w-full text-left px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
    </nav>
  );
}



