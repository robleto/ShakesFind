// netlify/functions/create-subscription.js
// Stripe subscription creation endpoint

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Price ID mapping
const STRIPE_PRICES = {
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  enterprise_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL
};

// Plan configuration
const PLAN_CONFIG = {
  professional_monthly: { tier: 'professional', daily_limit: 3334, monthly_limit: 100000 },
  professional_annual: { tier: 'professional', daily_limit: 3334, monthly_limit: 100000 },
  enterprise_monthly: { tier: 'enterprise', daily_limit: 33333, monthly_limit: 1000000 },
  enterprise_annual: { tier: 'enterprise', daily_limit: 33333, monthly_limit: 1000000 }
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, name, plan, payment_method, priceId } = JSON.parse(event.body);

    // Determine which price ID to use
    const selectedPriceId = priceId || STRIPE_PRICES[plan];
    if (!selectedPriceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid plan selected' })
      };
    }

    // Get plan configuration
    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG[Object.keys(PLAN_CONFIG).find(key => STRIPE_PRICES[key] === selectedPriceId)];
    if (!planConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Plan configuration not found' })
      };
    }
    
    // Define pricing plans
    const plans = {
      free: { price: null, requests: 1000, name: 'Free' },
      professional_monthly: { price: 'price_professional_monthly', requests: 100000, name: 'Professional Monthly' },
      professional_annual: { price: 'price_professional_annual', requests: 100000, name: 'Professional Annual' },
      enterprise_monthly: { price: 'price_enterprise_monthly', requests: 1000000, name: 'Enterprise Monthly' },
      enterprise_annual: { price: 'price_enterprise_annual', requests: 1000000, name: 'Enterprise Annual' }
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid plan selected' })
      };
    }

    let customerId;
    let subscriptionId = null;

    // Create or get customer
    const existingCustomers = await stripe.customers.list({ email });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name,
        payment_method,
        invoice_settings: { default_payment_method: payment_method }
      });
      customerId = customer.id;
    }

    // For paid plans, create subscription
    if (selectedPlan.price) {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: selectedPlan.price }],
        default_payment_method: payment_method,
        expand: ['latest_invoice.payment_intent']
      });
      subscriptionId = subscription.id;
    }

    // Generate API key in database
    const apiKeyResult = await db.generateApiKey(
      email, 
      name, 
      null, // company
      `${selectedPlan.name} Plan`, // use case
      `Stripe Customer: ${customerId}` // description
    );

    // Update API key with plan details
    if (apiKeyResult.success) {
      await db.updateApiKeyLimits(apiKeyResult.api_key, {
        tier: plan,
        daily_limit: Math.floor(selectedPlan.requests / 30), // Rough daily limit
        monthly_limit: selectedPlan.requests,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        api_key: apiKeyResult.api_key,
        plan: selectedPlan.name,
        daily_limit: Math.floor(selectedPlan.requests / 30),
        monthly_limit: selectedPlan.requests,
        customer_id: customerId,
        subscription_id: subscriptionId
      })
    };

  } catch (error) {
    console.error('Subscription creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create subscription',
        details: error.message 
      })
    };
  }
};
