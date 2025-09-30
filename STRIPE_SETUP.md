# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys

# Stripe Secret Key (starts with sk_test_ for test mode, sk_live_ for live mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Publishable Key (starts with pk_test_ for test mode, pk_live_ for live mode)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret (get this from your webhook endpoint in Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (get these from your Stripe Dashboard > Products)
# Create products and prices for your subscription plans:
# - Pro Plan: $19.99/month
# - Enterprise Plan: $200/month
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here

# Application URL (used for redirect URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Optional: Stripe Portal Configuration ID (if you want to use a specific configuration)
# If not provided, the system will automatically create a default configuration
# STRIPE_PORTAL_CONFIGURATION_ID=bpc_your_configuration_id_here

## Customer Portal Setup

The billing management feature uses Stripe's Customer Portal, which allows customers to:
- Update their payment methods
- Cancel their subscriptions
- Update their subscription plans
- View billing history

The system automatically creates a default portal configuration with the following features:
- Payment method updates (enabled)
- Subscription cancellation at period end (enabled)
- Subscription plan updates (enabled)
- Cancellation reason collection (enabled)

If you want to customize the portal configuration, you can:
1. Create a configuration in your Stripe Dashboard at https://dashboard.stripe.com/test/settings/billing/portal
2. Set the STRIPE_PORTAL_CONFIGURATION_ID environment variable with your configuration ID

## Testing the Billing Portal

To test the billing management functionality:
1. Make sure you have valid Stripe API keys set up
2. Create a test subscription through the app
3. Click "Manage Billing" on the billing page
4. You should be redirected to Stripe's Customer Portal where you can update payment methods
