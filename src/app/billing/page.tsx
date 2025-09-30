'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  features: string[];
  popular?: boolean;
  prices: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  }[];
}

interface CurrentSubscription {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingInfo {
  email: string;
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isTestCustomer?: boolean;
}

export default function Billing() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch pricing plans from Stripe
  const fetchPricingPlans = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/billing/pricing', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlans(data.plans);
          console.log('Pricing plans loaded:', data.plans.length, 'plans');
        } else {
          console.error('Failed to fetch pricing plans:', data.error);
        }
      } else {
        console.error('Failed to fetch pricing plans, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      // Set empty plans to stop loading state
      setPlans([]);
    }
  };

  // Load billing data function
  const loadBillingData = async () => {
    try {
      // Check if user is authenticated
      const authResponse = await fetch('/api/auth/user');
      if (!authResponse.ok) {
        setError('Please log in to access billing information');
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Fetch pricing plans and other data in parallel
      await Promise.all([
        fetchPricingPlans(),
        fetch('/api/billing/subscription').then(async (response) => {
          if (response.ok) {
            const subscriptionData = await response.json();
            setCurrentSubscription(subscriptionData);
          }
        }),
        fetch('/api/billing/info').then(async (response) => {
          if (response.ok) {
            const billingData = await response.json();
            setBillingInfo(billingData);
          }
        })
      ]);

    } catch (error) {
      console.error('Error loading billing data:', error);
      setError('Failed to load billing information');
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and load billing data
  useEffect(() => {
    loadBillingData();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setUpgradingPlanId(planId);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to create checkout session');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        // Provide more specific error messages
        if (errorData.message && errorData.message.includes('configuration')) {
          setError('Billing portal is not properly configured. Please contact support or try again later.');
        } else {
          setError(errorData.message || 'Failed to create billing portal session');
        }
      }
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      setError('Failed to create billing portal session. Please check your internet connection and try again.');
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh subscription data
        await loadBillingData();
        setShowCancelModal(false);
        // Show success message
        setError(null);
        // You could add a success state here if needed
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDowngradeCanceled = async () => {
    setIsDowngrading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/downgrade-canceled', {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh subscription data
        await loadBillingData();
        setError(null);
        // You could add a success message here
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to downgrade API limits');
      }
    } catch (error) {
      console.error('Error downgrading canceled subscription:', error);
      setError('Failed to downgrade API limits');
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh subscription data
        await loadBillingData();
        setError(null);
      } else {
        const errorData = await response.json();
        // Provide more user-friendly error messages
        if (errorData.message && errorData.message.includes('canceled subscription can only update its cancellation_details')) {
          setError('This subscription has already been fully canceled and cannot be reactivated. Please contact support or create a new subscription.');
        } else {
          setError(errorData.error || 'Failed to reactivate subscription');
        }
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      setError('Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  // Helper function to get the monthly price for a plan
  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    const monthlyPrice = plan.prices.find(price => price.interval === 'month');
    return monthlyPrice ? monthlyPrice.amount / 100 : 0; // Convert from cents to dollars
  };

  // Helper function to format price
  const formatPrice = (amount: number) => {
    return amount === 0 ? '$0' : `$${amount.toFixed(2)}`;
  };

  const getCurrentPlan = () => {
    if (!currentSubscription || plans.length === 0) return plans[0] || null; // Default to free
    return plans.find(plan => plan.id === currentSubscription.planId) || plans[0];
  };

  const getFuturePlan = () => {
    if (!currentSubscription || plans.length === 0) return plans[0] || null; // Default to free
    
    // If subscription is canceled at period end, will downgrade to Free
    if (currentSubscription.cancelAtPeriodEnd) {
      return plans.find(plan => plan.id === 'free') || plans[0]; // Free plan
    }
    
    // Otherwise stays on current plan
    return getCurrentPlan();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to access your billing information.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription and billing information
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Plans</h2>
          
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pricing plans...</p>
              <p className="text-sm text-gray-500 mt-2">If this takes too long, pricing may not be configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.planId === plan.id;
              const isFree = plan.id === 'free';
              const isDowngrade = currentSubscription?.planId === 'enterprise' && plan.id === 'pro';
              const showPopular = plan.popular && currentSubscription?.planId !== 'enterprise' && !isCurrentPlan;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-lg shadow-sm border-2 p-6 ${
                    showPopular ? 'border-blue-500' : 'border-gray-200'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {showPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(getMonthlyPrice(plan))}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || isFree || upgradingPlanId !== null}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isFree
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDowngrade
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {upgradingPlanId === plan.id ? 'Processing...' : 
                     isCurrentPlan ? 'Current Plan' : 
                     isFree ? 'Free Plan' : 
                     isDowngrade ? 'Downgrade' : 
                     'Upgrade'}
                  </button>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Combined Subscription & Billing Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account & Billing</h2>
          
          {/* Status badge positioned at top right */}
          {currentSubscription && (
            <span className={`absolute top-6 right-6 px-3 py-1 rounded-full text-sm font-medium ${
              currentSubscription.status === 'active' && !currentSubscription.cancelAtPeriodEnd
                ? 'bg-green-100 text-green-800' 
                : currentSubscription.cancelAtPeriodEnd
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {currentSubscription.status === 'active' && !currentSubscription.cancelAtPeriodEnd
                ? 'Active' 
                : currentSubscription.cancelAtPeriodEnd
                ? 'Scheduled for Cancellation'
                : 'Inactive'}
            </span>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Subscription */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
              
              {currentSubscription ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{getCurrentPlan()?.name || 'Unknown'} Plan</h4>
                    <p className="text-sm text-gray-600">
                      {getCurrentPlan() ? formatPrice(getMonthlyPrice(getCurrentPlan()!)) : 'Free'}
                    </p>
                    {currentSubscription.cancelAtPeriodEnd && getFuturePlan()?.id !== getCurrentPlan()?.id && (
                      <p className="text-sm text-orange-600 mt-1">
                        Will downgrade to {getFuturePlan()?.name || 'Free'} Plan on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {(currentSubscription.status === 'active' || currentSubscription.cancelAtPeriodEnd) && (
                    <div className="text-sm text-gray-600">
                      <p>
                        {currentSubscription.cancelAtPeriodEnd 
                          ? `Access ends on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                          : `Renews on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleManageBilling}
                      disabled={isManagingBilling}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isManagingBilling ? 'Opening Portal...' : 'Manage Billing'}
                    </button>
                    {/* Show buttons based on subscription status */}
                    {currentSubscription.status === 'active' && currentSubscription.planId !== 'free' && !currentSubscription.cancelAtPeriodEnd && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={isCanceling}
                        className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    )}
                    
                    {/* Show reactivate/downgrade buttons for canceled subscriptions */}
                    {currentSubscription.cancelAtPeriodEnd && currentSubscription.planId !== 'free' && (
                      <>
                        <button
                          onClick={handleReactivateSubscription}
                          disabled={isReactivating}
                          className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReactivating ? 'Reactivating...' : 'Keep Pro Plan'}
                        </button>
                        <button
                          onClick={handleDowngradeCanceled}
                          disabled={isDowngrading}
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDowngrading ? 'Downgrading...' : 'Switch to Free Limits Now'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">No active subscription found.</p>
                </div>
              )}
            </div>

            {/* Billing Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
              
              {billingInfo ? (
                <div className="space-y-3">
                  {billingInfo.isTestCustomer && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                      <p className="text-xs text-yellow-800">
                        <span className="font-medium">Test Mode:</span> This is a test subscription with limited billing information.
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{billingInfo.email}</p>
                  </div>
                  {billingInfo.name && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Name</p>
                      <p className="text-sm text-gray-600">{billingInfo.name}</p>
                    </div>
                  )}
                  {billingInfo.address && (billingInfo.address.line1 || billingInfo.address.city || billingInfo.address.postalCode) ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Billing Address</p>
                      <div className="text-sm text-gray-600">
                        {billingInfo.address.line1 && (
                          <div>{billingInfo.address.line1.replace(/<br\s*\/?>/gi, '')}</div>
                        )}
                        {billingInfo.address.line2 && (
                          <div>{billingInfo.address.line2.replace(/<br\s*\/?>/gi, '')}</div>
                        )}
                        {billingInfo.address.city && billingInfo.address.state && billingInfo.address.postalCode && (
                          <div>{billingInfo.address.city}, {billingInfo.address.state} {billingInfo.address.postalCode}</div>
                        )}
                        {billingInfo.address.country && (
                          <div>{billingInfo.address.country}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Billing Address</p>
                      <p className="text-sm text-gray-500 italic">No address on file</p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Use &quot;Manage Billing&quot; to update your payment method and billing address.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm mb-3">No billing information available.</p>
                  <p className="text-xs text-gray-500">
                    Billing information will be available after your first subscription.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period ({currentSubscription?.currentPeriodEnd ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}), after which you&apos;ll be downgraded to the Free plan.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
