// netlify/functions/dashboard.js
// API key dashboard and management

const db = require('../../config/database');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { queryStringParameters: query } = event;
    
    if (!query || !query.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Email parameter required"
        })
      };
    }

    // Get user's API keys and usage stats
    const apiKeys = await db.getUserApiKeys(query.email);
    
    // Calculate total usage across all keys
    let totalDaily = 0;
    let totalMonthly = 0;
    const keyStats = apiKeys.map(key => {
      const dailyUsed = key.daily_limit - (key.requests_remaining || 0);
      const monthlyUsed = (key.monthly_usage || 0);
      
      totalDaily += dailyUsed;
      totalMonthly += monthlyUsed;
      
      return {
        preview: key.key_preview,
        tier: key.tier,
        status: key.is_active ? 'Active' : 'Inactive',
        daily: {
          used: dailyUsed,
          limit: key.daily_limit,
          remaining: key.requests_remaining || 0
        },
        monthly: {
          used: monthlyUsed,
          limit: key.monthly_limit || 1000,
          remaining: (key.monthly_limit || 1000) - monthlyUsed
        },
        totalRequests: key.requests_total,
        lastUsed: key.last_request_at,
        created: key.created_at
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email: query.email,
        keyCount: apiKeys.length,
        totalUsage: {
          daily: totalDaily,
          monthly: totalMonthly
        },
        keys: keyStats,
        subscription: {
          // This would be populated from Stripe data
          plan: apiKeys[0]?.tier || 'free',
          status: 'active',
          nextBilling: null
        }
      })
    };

  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch dashboard data',
        details: error.message
      })
    };
  }
};
