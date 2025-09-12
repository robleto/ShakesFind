#!/usr/bin/env node
/*
 Test Stripe webhook events locally without needing Stripe CLI login.
 Simulates payment_failed and payment_succeeded events.
*/
require('dotenv').config();
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_URL = 'http://localhost:4000/.netlify/functions/webhook-stripe';

// Sample webhook events
const paymentFailedEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  type: 'invoice.payment_failed',
  data: {
    object: {
      id: 'in_test_123',
      customer: 'cus_SvLL36nhMHlTdn', // Use actual customer ID from subscription
      subscription: 'sub_1RzUeWAGq6wUZ95iOeiGy2FP'
    }
  }
};

const paymentSucceededEvent = {
  id: 'evt_test_webhook2',
  object: 'event', 
  type: 'invoice.payment_succeeded',
  data: {
    object: {
      id: 'in_test_456',
      customer: 'cus_SvLL36nhMHlTdn',
      subscription: 'sub_1RzUeWAGq6wUZ95iOeiGy2FP'
    }
  }
};

function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhook(event, description) {
  const payload = JSON.stringify(event);
  const signature = createStripeSignature(event, WEBHOOK_SECRET);
  
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`Event: ${event.type}`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: payload
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🔥 Testing Stripe webhook handlers...');
  
  if (!WEBHOOK_SECRET) {
    console.log('❌ STRIPE_WEBHOOK_SECRET not set in .env');
    process.exit(1);
  }
  
  await testWebhook(paymentFailedEvent, 'Payment Failed (should suspend API key)');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testWebhook(paymentSucceededEvent, 'Payment Succeeded (should restore API key)');
  
}

runTests();
