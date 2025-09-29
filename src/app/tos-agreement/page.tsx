'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TosContentData {
  content: string;
  version: string;
  currentVersion: string;
  isCurrentVersion: boolean;
}

function TosAgreementContent() {
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tosData, setTosData] = useState<TosContentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the return URL from query params, default to home
  const returnUrl = searchParams.get('return') || '/';

  useEffect(() => {
    const fetchTosContent = async () => {
      try {
        const response = await fetch('/api/tos/content');
        if (!response.ok) {
          throw new Error('Failed to fetch TOS content');
        }
        
        const result = await response.json();
        if (result.success) {
          setTosData(result.data);
        } else {
          throw new Error(result.message || 'Failed to load TOS content');
        }
      } catch (err) {
        console.error('Error fetching TOS content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load TOS content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTosContent();
  }, []);

  const handleAgree = async () => {
    if (!tosData) return;
    
    setIsAgreeing(true);
    
    try {
      // Call the TOS agreement API
      const response = await fetch('/api/tos/agree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tosVersion: tosData.currentVersion,
        }),
      });

      if (response.ok) {
        // Redirect to the return URL
        router.push(returnUrl);
      } else {
        const error = await response.json();
        console.error('Failed to agree to TOS:', error);
        alert('Failed to process agreement. Please try again.');
      }
    } catch (error) {
      console.error('Error agreeing to TOS:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsAgreeing(false);
    }
  };

  const handleDecline = () => {
    // Redirect back to home or login page
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Terms of Service...</p>
        </div>
      </div>
    );
  }

  if (error || !tosData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Terms</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to load Terms of Service'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Terms of Service Agreement</h1>
            <p className="text-blue-100 mt-1">Please read and agree to our terms to continue</p>
            <p className="text-blue-200 text-sm mt-1">Version {tosData.currentVersion}</p>
          </div>

          {/* TOS Content */}
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {tosData.content}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDecline}
                disabled={isAgreeing}
                className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                onClick={handleAgree}
                disabled={isAgreeing}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAgreeing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'I Agree to Terms of Service'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TosAgreement() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading Terms of Service...</p>
        </div>
      </div>
    }>
      <TosAgreementContent />
    </Suspense>
  );
}
