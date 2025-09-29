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
