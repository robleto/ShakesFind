## Stripe Setup

### 1. Products & Prices
Create two products: Professional, Enterprise. For each, add Monthly & Annual recurring prices. Capture price IDs.

### 2. Environment Variables
Set:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_...
```

### 3. Webhook
Endpoint URL: `https://<your-domain>/.netlify/functions/webhook-stripe`
Events: subscription updated/deleted, invoice payment failed/succeeded.
Store signing secret as `STRIPE_WEBHOOK_SECRET`.

### 4. Subscription Creation Flow
Front-end invokes create-subscription function with email + plan or priceId. Returned `client_secret` can be used to finalize payment intent (Stripe Elements) if you expand front-end.

### 5. Tier Mapping
Plan Key → Limits: defined in function `create-subscription*.js` (`PLAN_CONFIG`). Adjust there for new tiers.

### 6. Testing
Use test cards (4242 4242 4242 4242). Simulate failure by using incomplete card or test failure numbers.

End.