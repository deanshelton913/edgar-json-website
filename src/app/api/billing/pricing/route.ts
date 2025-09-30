import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SettingsService } from '../../../../services/SettingsService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function GET() {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe not configured, using fallback pricing');
      throw new Error('Stripe not configured');
    }

    // Get Stripe price IDs from settings
    const priceIds = await SettingsService.getStripePriceIds();
    console.log('Price IDs from settings:', priceIds);

    // Fetch prices from Stripe using the stored price IDs
    const proPrice = priceIds.pro ? await stripe.prices.retrieve(priceIds.pro) : null;
    const enterprisePrice = priceIds.enterprise ? await stripe.prices.retrieve(priceIds.enterprise) : null;

    console.log('Pro price found:', proPrice?.id, proPrice?.unit_amount);
    console.log('Enterprise price found:', enterprisePrice?.id, enterprisePrice?.unit_amount);

    const plans = [];

    // Always include Free plan
    plans.push({
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      features: [
        '100 requests per day',
        '10 requests per minute',
        'Basic support',
        'Standard API access'
      ],
      requestsPerMinute: 10,
      requestsPerDay: 100,
      popular: false,
      prices: [{
        id: 'free',
        amount: 0,
        currency: 'usd',
        interval: 'month',
        intervalCount: 1,
      }]
    });

    // Add Pro plan if price ID is configured
    if (proPrice) {
      plans.push({
        id: 'pro',
        name: 'Pro',
        description: 'For growing applications',
        features: [
          '10,000 requests per day',
          '100 requests per minute',
          'Priority support',
          'Standard API access',
          'Webhooks (coming soon)'
        ],
        requestsPerMinute: 100,
        requestsPerDay: 10000,
        popular: true,
        prices: [{
          id: proPrice.id,
          amount: proPrice.unit_amount || 0,
          currency: proPrice.currency,
          interval: proPrice.recurring?.interval || 'month',
          intervalCount: proPrice.recurring?.interval_count || 1,
        }]
      });
      console.log('Added Pro plan with price:', proPrice.unit_amount);
    } else {
      console.log('Pro plan price ID not configured in settings - will not be displayed');
    }

    // Add Enterprise plan if price ID is configured
    if (enterprisePrice) {
      plans.push({
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For high-volume applications',
        features: [
          '50,000 requests per day',
          '500 requests per minute',
          '24/7 dedicated support',
          'Standard API access',
          'Webhooks (coming soon)',
          'Custom integrations',
          'SLA guarantee'
        ],
        requestsPerMinute: 500,
        requestsPerDay: 50000,
        popular: false,
        prices: [{
          id: enterprisePrice.id,
          amount: enterprisePrice.unit_amount || 0,
          currency: enterprisePrice.currency,
          interval: enterprisePrice.recurring?.interval || 'month',
          intervalCount: enterprisePrice.recurring?.interval_count || 1,
        }]
      });
      console.log('Added Enterprise plan with price:', enterprisePrice.unit_amount);
    } else {
      console.log('Enterprise plan price ID not configured in settings - will not be displayed');
    }

    console.log(`Returning ${plans.length} plans`);

    return NextResponse.json({
      success: true,
      plans: plans
    });

  } catch (error) {
    console.error('Error fetching pricing from Stripe:', error);
    
    // Return only Free plan if Stripe fails - never show fallback pricing for paid plans
    const fallbackPlans = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        features: [
          '100 requests per day',
          '10 requests per minute',
          'Basic support',
          'Standard API access'
        ],
        requestsPerMinute: 10,
        requestsPerDay: 100,
        popular: false,
        prices: [{
          id: 'free',
          amount: 0,
          currency: 'usd',
          interval: 'month',
          intervalCount: 1,
        }]
      }
    ];

    console.log('Stripe failed - returning only Free plan to avoid misrepresenting pricing');

    return NextResponse.json({
      success: true,
      plans: fallbackPlans,
      fallback: true
    });
  }
}
