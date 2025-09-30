'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayIcon } from "@heroicons/react/24/outline";
import { Highlight } from "prism-react-renderer";
import { themes } from "prism-react-renderer";

interface ApiKeyData {
  apiKey: string;
  userId: string;
  email: string;
  currentTier: string;
  usageCount: number;
  createdAt: string;
  lastUsed?: string;
  requestsPerMinute?: number;
  requestsPerDay?: number;
}

interface ComplianceRequirement {
  type: 'tos_agreement' | 'profile_update' | 'verification';
  message: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceCheckResult {
  isCompliant: boolean;
  requirements: ComplianceRequirement[];
  userId: string;
}

export default function ApiKey() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Test API state
  const [testCode, setTestCode] = useState('');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Get base URL dynamically
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
  };

  const fetchApiKey = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching API key for user:', userId);
      
      // Use the Vercel API key endpoint
      const response = await fetch('/api/api-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API key response status:', response.status);
      console.log('API key response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('API key data received:', data);
        if (data.success) {
          setApiKeyData(data.data);
        } else {
          setApiKeyData(null);
        }
      } else if (response.status === 404) {
        // No API key found - this is expected for new users
        console.log('No API key found (404) - user needs to create one');
        setApiKeyData(null);
      } else {
        const errorData = await response.json();
        console.error('API key fetch error:', errorData);
        setError(errorData.message || errorData.error || 'Failed to fetch API key');
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError('Failed to connect to the API. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkCompliance = useCallback(async () => {
    try {
      console.log('Checking compliance requirements...');
      const response = await fetch('/api/compliance');
      console.log('Compliance response status:', response.status);
      
      if (!response.ok) {
        console.error('Compliance check failed:', response.status);
        setError('Failed to check compliance requirements');
        setIsLoading(false);
        return;
      }

      const complianceData = await response.json();
      console.log('Compliance data:', complianceData);
      
      if (!complianceData.isCompliant) {
        console.log('User not compliant, showing modal');
        setComplianceResult(complianceData);
        setShowComplianceModal(true);
        setIsLoading(false);
        return;
      }

      // User is compliant, continue with API key check
      await fetchApiKey(userId!);
    } catch (error) {
      console.error('Error checking compliance:', error);
      setError('Failed to check compliance requirements');
      setIsLoading(false);
    }
  }, [userId, fetchApiKey]);

  // Get user info from secure cookies
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        console.log('Checking user authentication...');
        // Get user info from secure cookies via API
        const response = await fetch('/api/auth/user');
        console.log('User auth response status:', response.status);
        
        if (!response.ok) {
          console.log('User not authenticated, status:', response.status);
          setError('Please log in to access your API keys');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('User auth data:', data);
        
        if (data.authenticated) {
          console.log('User authenticated, userId:', data.user.userId);
          setUserId(data.user.userId);
          
          // First check compliance requirements
          await checkCompliance();
        } else {
          console.log('User not authenticated');
          setError('Please log in to access your API keys');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
        setError('Failed to get user information');
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, [checkCompliance]);

  // Initialize test code when API key data is available
  useEffect(() => {
    if (apiKeyData?.apiKey) {
      const baseUrl = getApiBaseUrl();
      const apiKey = apiKeyData.apiKey;
      const newTestCode = `fetch('${baseUrl}/api/v1/filings/1578217/000157821725000004/0001578217-25-000004.json', {
  headers: {
    'Authorization': 'Bearer ${apiKey}'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
      setTestCode(newTestCode);
    }
  }, [apiKeyData]);

  const createApiKey = async () => {
    if (!userId) return;

    try {
      setIsCreating(true);
      setError(null);

      console.log('Creating API key for user:', userId);
      
      // Call the Vercel API key creation endpoint
      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API key creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API key created successfully:', data);
        if (data.success) {
          setApiKeyData(data.data);
        } else {
          setError(data.message || data.error || 'Failed to create API key');
        }
      } else {
        const errorData = await response.json();
        console.error('API key creation error:', errorData);
        setError(errorData.message || errorData.error || 'Failed to create API key');
      }

    } catch (error) {
      console.error('Error creating API key:', error);
      setError('Failed to create API key. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const handleComplianceAction = async (requirement: ComplianceRequirement) => {
    if (requirement.type === 'tos_agreement') {
      // Redirect to TOS agreement page
      window.location.href = '/tos-agreement?return=/api-key';
    }
    // Add other compliance actions as needed
  };

  const handleDeleteApiKey = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/api-key/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        // API key deleted successfully, refresh the page
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Delete API key error:', error);
      setError('Failed to delete API key');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const obfuscateApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return apiKey;
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(apiKey.length - 8, 4));
    return `${start}${middle}${end}`;
  };

  // Test API functionality
  const handleTestApi = async () => {
    if (!apiKeyData?.apiKey) return;
    
    setIsTesting(true);
    setTestError(null);
    setTestResponse(null);

    try {
      // Extract URL from the JavaScript code
      const urlMatch = testCode.match(/fetch\('([^']+)'/);
      if (!urlMatch) {
        setTestError('Invalid JavaScript code format');
        return;
      }
      
      const apiUrl = urlMatch[1];
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKeyData.apiKey}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResponse(JSON.stringify(data, null, 2));
        // Refresh API key data to update usage count
        if (userId) {
          await fetchApiKey(userId);
        }
      } else {
        setTestError(`Error ${response.status}: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setTestError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };


  if (showComplianceModal && complianceResult) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg mx-4 transform transition-all duration-300 scale-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to EDGAR API! 🎉</h2>
            <p className="text-lg text-gray-600 mb-2">You&apos;re almost ready to start exploring SEC data!</p>
            <p className="text-gray-500">Just a quick setup step to get you started:</p>
          </div>

          <div className="space-y-4 mb-8">
            {complianceResult.requirements.map((requirement, index) => (
              <div key={index} className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{requirement.message}</p>
                    <p className="text-sm text-blue-600 mt-1">Quick & easy setup</p>
                  </div>
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleComplianceAction(complianceResult.requirements[0])}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Let&apos;s Get Started! →</span>
            </button>
            
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              This will only take a moment and helps us provide you with the best experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-lg mt-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Fetching your API key information</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white shadow-xl rounded-lg mt-12 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white shadow-xl rounded-lg mt-4 md:mt-12">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">API Key Management 🔑</h2>
        </div>
        <p className="text-sm md:text-base text-gray-600 px-4">
          Manage your API keys for accessing the EDGAR JSON API
        </p>
      </div>

      {apiKeyData ? (
        /* Existing API Key */
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Your API Key</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {apiKeyData.currentTier.toUpperCase()} TIER
              </span>
            </div>
            
            <div className="bg-white border border-green-200 rounded-md p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <code className="text-sm md:text-lg font-mono text-gray-800 break-all flex-1">
                  {obfuscateApiKey(apiKeyData.apiKey)}
                </code>
                <button
                  onClick={() => copyToClipboard(apiKeyData.apiKey)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Usage Count:</span>
                <span className="ml-2 font-medium">{apiKeyData.usageCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(apiKeyData.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Used:</span>
                <span className="ml-2 font-medium">
                  {apiKeyData.lastUsed ? new Date(apiKeyData.lastUsed).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Rate Limit (Minute):</span>
                <span className="ml-2 font-medium text-blue-600">
                  {apiKeyData.requestsPerMinute || 10} requests
                </span>
              </div>
              <div>
                <span className="text-gray-600">Rate Limit (Day):</span>
                <span className="ml-2 font-medium text-blue-600">
                  {apiKeyData.requestsPerDay || 100} requests
                </span>
              </div>
            </div>
            
            {/* Action Buttons - Mobile Responsive */}
            <div className="mt-6 space-y-3">
              {/* Upgrade Button - Largest and Most Prominent */}
              <a
                href="/billing"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Upgrade API Key</span>
              </a>
              
              {/* Secondary Actions Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/support"
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Test API Key</span>
                </a>
                
                {/* Delete Button */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-md hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete API Key</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rate Limits Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rate Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-yellow-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Per Minute</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {apiKeyData.requestsPerMinute || 10}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Maximum requests allowed in a 1-minute window
                </p>
              </div>
              <div className="bg-white border border-yellow-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Per Day</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {apiKeyData.requestsPerDay || 100}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Maximum requests allowed in a 24-hour period
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Rate limits reset automatically. If you exceed the limit, 
                you&apos;ll receive a 429 status code and need to wait for the window to reset.
              </p>
            </div>
          </div>

          {/* Test API Section */}
          <div className="mt-8 p-4 md:p-6 bg-blue-50 rounded-lg shadow-md">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              🧪 Test the API
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-700 text-sm md:text-base">
                Test the API with your own API key. Modify the JavaScript code below and click &quot;Run Code&quot; to see the JSON response.
              </p>
              
              <div className="space-y-3">
                <textarea
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs md:text-sm"
                  placeholder="Enter your JavaScript fetch code here..."
                />
                <button
                  onClick={handleTestApi}
                  disabled={isTesting || !testCode}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  {isTesting ? 'Running...' : 'Run Code'}
                </button>
              </div>

              {testError && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{testError}</p>
                </div>
              )}

              {testResponse && (
                <div className="border border-gray-300 rounded-md bg-gray-100 overflow-x-auto">
                  <div className="p-2 bg-gray-200 border-b border-gray-300">
                    <p className="text-sm font-medium text-gray-700">Response:</p>
                  </div>
                  <Highlight
                    code={testResponse}
                    language="json"
                    theme={themes.github}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={`${className} p-4 text-sm`} style={style}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/support"
              className="inline-flex items-center px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              🛠️ Get Support
            </a>
          </div>
          </div>
      ) : (
        /* No API Key - Create One */
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Key Found</h3>
          <p className="text-gray-600 mb-6">
            You don&apos;t have an API key yet. Create one to start using the EDGAR JSON API.
          </p>
          
          <button
            onClick={createApiKey}
            disabled={isCreating}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create API Key</span>
              </>
            )}
          </button>

          {/* Free Tier Info */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Free Tier Benefits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 100 API requests per day</li>
              <li>• 10 requests per minute rate limit</li>
              <li>• Access to all SEC filing data</li>
              <li>• JSON format responses</li>
            </ul>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete API Key</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete your API key? This will permanently remove your access to the EDGAR JSON API.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ Warning: This action cannot be undone. You will need to create a new API key to regain access.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApiKey}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete API Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
