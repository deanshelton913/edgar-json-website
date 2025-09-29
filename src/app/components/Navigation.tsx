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
    <nav className="p-4 bg-white shadow-md flex items-center justify-between">
      <Link href="/" className="text-2xl font-bold text-gray-900">
        EDGAR API
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-6">
        <div className="space-x-6">
          <Link href="/api-key" className="text-gray-700 hover:text-blue-600">
            Api Key
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/usage-stats" className="text-gray-700 hover:text-blue-600">
                Usage Stats
              </Link>
              <Link href="/billing" className="text-gray-700 hover:text-blue-600">
                Billing
              </Link>
            </>
          )}
          <Link href="/docs" className="text-gray-700 hover:text-blue-600">
            Docs
          </Link>
          <Link href="/terms" className="text-gray-700 hover:text-blue-600">
            Terms
          </Link>
        </div>
        
        {/* Authentication Section */}
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        ) : isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {userInfo?.name || userInfo?.email}
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
    </nav>
  );
}



