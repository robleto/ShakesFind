const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../../config/database');

// Price ID mapping from environment variables
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
  // Handle CORS preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { email, name, plan, priceId } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and name are required' })
      };
    }

    // Determine which price ID to use (priceId takes precedence over plan)
    let selectedPriceId = priceId;
    let planConfig;

    if (priceId) {
      // Find plan config by price ID
      const planKey = Object.keys(STRIPE_PRICES).find(key => STRIPE_PRICES[key] === priceId);
      planConfig = planKey ? PLAN_CONFIG[planKey] : null;
    } else if (plan) {
      // Use plan name to get price ID and config
      selectedPriceId = STRIPE_PRICES[plan];
      planConfig = PLAN_CONFIG[plan];
    }

    if (!selectedPriceId || !planConfig) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid plan or price ID', 
          available_plans: Object.keys(PLAN_CONFIG) 
        })
      };
    }

    console.log(`Creating subscription for ${email} with plan ${planConfig.tier}`);

    // Create or get customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(`Found existing customer: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: { 
          source: 'game_awards_api',
          tier: planConfig.tier
        }
      });
      console.log(`Created new customer: ${customer.id}`);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: selectedPriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tier: planConfig.tier,
        daily_limit: planConfig.daily_limit.toString(),
        monthly_limit: planConfig.monthly_limit.toString()
      }
    });

    console.log(`Created subscription: ${subscription.id}`);

    // Generate API key via helper
    const keyResult = await db.generateApiKey(
      email,
      name,
      null,
      'Stripe subscription',
      'Tier: ' + planConfig.tier
    );

    if (!keyResult || !keyResult.success) {
      throw new Error('Failed to generate API key: ' + (keyResult?.error || 'Unknown error'));
    }

    const apiKey = keyResult.api_key;

    // Apply subscription limits & stripe linkage
    await db.updateApiKeyLimits(apiKey, {
      tier: planConfig.tier,
      daily_limit: planConfig.daily_limit,
      monthly_limit: planConfig.monthly_limit,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id
    });

    console.log(`Generated API key & applied limits for ${email}`);

    // Return subscription details
    const result = {
      success: true,
      subscription_id: subscription.id,
      customer_id: customer.id,
      client_secret: subscription.latest_invoice.payment_intent.client_secret,
  api_key: apiKey,
      plan: planConfig.tier,
      daily_limit: planConfig.daily_limit,
      monthly_limit: planConfig.monthly_limit,
      price_id: selectedPriceId
    };

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify(result) 
    };

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create subscription',
        message: error.message
      })
    };
  }
};
