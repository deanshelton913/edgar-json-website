'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        if (code) {
          // Exchange the code for tokens
          try {
            const tokenResponse = await fetch('https://edgar-json-auth.auth.us-west-2.amazoncognito.com/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: 'q7s3g7snt1fquvl3tgt98tb34',
                code: code,
                redirect_uri: window.location.hostname === 'localhost' 
                  ? `http://localhost:${window.location.port}/auth/redirect`
                  : 'https://edgar-json.com/auth/redirect',
              }),
            });

            if (tokenResponse.ok) {
              const tokens = await tokenResponse.json();
              
              // Store tokens in localStorage
              localStorage.setItem('cognito_access_token', tokens.access_token);
              localStorage.setItem('cognito_id_token', tokens.id_token);
              localStorage.setItem('cognito_refresh_token', tokens.refresh_token);
              
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');
              
              // Redirect to API key page after a short delay
              const redirectUrl = window.location.hostname === 'localhost' 
                ? `http://localhost:${window.location.port}/api-key`
                : '/api-key';
                
              setTimeout(() => {
                router.push(redirectUrl);
              }, 2000);
            } else {
              throw new Error('Failed to exchange code for tokens');
            }
          } catch (tokenError) {
            console.error('Token exchange error:', tokenError);
            setStatus('error');
            setMessage('Failed to complete authentication. Please try again.');
          }
        } else {
          setStatus('error');
          setMessage('No authorization code received');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during authentication');
        console.error('Auth callback error:', error);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authenticating...
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your authentication.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we load the authentication page.
            </p>
          </div>
        </div>
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}
