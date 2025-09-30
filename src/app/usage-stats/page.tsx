'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsageStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  successRate: number;
  averageResponseTimeMs: number;
}

interface RateLimitInfo {
  requestsPerMinute: number;
  requestsPerDay: number;
  currentMinuteCount: number;
  currentDayCount: number;
  resetTimeMinute: string;
  resetTimeDay: string;
  isLimited: boolean;
}

interface UsageData {
  usageStats: UsageStats;
  rateLimitInfo: RateLimitInfo;
  apiKey: string;
}

export default function UsageStatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchUsageStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/usage-stats?days=${days}`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsageData(data.data);
        } else {
          setError(data.message || data.error || 'Failed to fetch usage statistics');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to fetch usage statistics');
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      setError('Failed to connect to the API. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  // Get user info and fetch usage stats
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Get user info from secure cookies via API
        const response = await fetch('/api/auth/user');
        
        if (!response.ok) {
          setError('Please log in to view usage statistics');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.authenticated) {
          // Fetch usage stats using cookie authentication
          await fetchUsageStats();
        } else {
          setError('Please log in to view usage statistics');
        }
      } catch (error) {
        console.error('Error getting user info:', error);
        setError('Failed to get user information');
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, [fetchUsageStats]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    fetchUsageStats();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };


  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-lg text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Loading...</h2>
        <p className="text-gray-600">Fetching your usage statistics</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg text-center">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Error</h2>
        <p className="text-gray-600 mb-3">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">No Data</h2>
        <p className="text-gray-600">No usage statistics available</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Usage Statistics 📊</h2>
        <p className="text-gray-600 text-sm">
          Monitor your API usage and rate limits
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-base font-semibold mb-2">Time Period</h3>
        <div className="flex space-x-2">
          {[7, 30, 90].map((dayCount) => (
            <button
              key={dayCount}
              onClick={() => handleDaysChange(dayCount)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                days === dayCount
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Last {dayCount} days
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Period: {formatDate(usageData.usageStats.period.start)} - {formatDate(usageData.usageStats.period.end)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Usage Statistics */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-blue-800 mb-3">Usage Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Total Requests:</span>
                <span className="ml-2 font-medium">{usageData.usageStats.totalRequests}</span>
              </div>
              <div>
                <span className="text-gray-600">Success Rate:</span>
                <span className="ml-2 font-medium">{usageData.usageStats.successRate.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Successful:</span>
                <span className="ml-2 font-medium text-green-600">{usageData.usageStats.successfulRequests}</span>
              </div>
              <div>
                <span className="text-gray-600">Errors:</span>
                <span className="ml-2 font-medium text-red-600">{usageData.usageStats.errorRequests}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Avg Response Time:</span>
                <span className="ml-2 font-medium">{usageData.usageStats.averageResponseTimeMs}ms</span>
              </div>
            </div>
          </div>

        </div>

        {/* Rate Limit Information */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-yellow-800 mb-3">Rate Limits</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Per Minute</span>
                  <span className="text-sm font-medium">
                    {usageData.rateLimitInfo.currentMinuteCount} / {usageData.rateLimitInfo.requestsPerMinute}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      usageData.rateLimitInfo.currentMinuteCount >= usageData.rateLimitInfo.requestsPerMinute * 0.8
                        ? 'bg-red-500'
                        : usageData.rateLimitInfo.currentMinuteCount >= usageData.rateLimitInfo.requestsPerMinute * 0.6
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (usageData.rateLimitInfo.currentMinuteCount / usageData.rateLimitInfo.requestsPerMinute) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resets at {formatTime(usageData.rateLimitInfo.resetTimeMinute)}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Per Day</span>
                  <span className="text-sm font-medium">
                    {usageData.rateLimitInfo.currentDayCount} / {usageData.rateLimitInfo.requestsPerDay}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      usageData.rateLimitInfo.currentDayCount >= usageData.rateLimitInfo.requestsPerDay * 0.8
                        ? 'bg-red-500'
                        : usageData.rateLimitInfo.currentDayCount >= usageData.rateLimitInfo.requestsPerDay * 0.6
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (usageData.rateLimitInfo.currentDayCount / usageData.rateLimitInfo.requestsPerDay) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resets at {formatTime(usageData.rateLimitInfo.resetTimeDay)}
                </p>
              </div>

              {usageData.rateLimitInfo.isLimited && (
                <div className="bg-red-100 border border-red-300 rounded-md p-2">
                  <p className="text-red-800 text-sm font-medium">⚠️ Rate limit exceeded</p>
                  <p className="text-red-600 text-xs">Please wait for the reset time before making more requests.</p>
                </div>
              )}
            </div>
          </div>

          {/* API Key Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">API Key</h3>
            <div className="text-sm">
              <div className="mb-1">
                <span className="text-gray-600">Key:</span>
                <span className="ml-2 font-mono">{usageData.apiKey}</span>
              </div>
              <div className="text-gray-500 text-xs">
                Your API key is masked for security. Use the full key in your requests.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

