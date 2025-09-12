const db = require('../../config/database');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Check database connectivity
    const dbHealth = await db.healthCheck();

    // Attempt to load build metadata if present
    let buildInfo = null;
    try {
      buildInfo = require('../../build-info.json');
    } catch(_) {}

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Game Awards API is running on Netlify Functions with Neon database',
        database: {
          status: 'connected',
          timestamp: dbHealth.timestamp
        },
        build: buildInfo || null
      })
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
        error: error.message
      })
    };
  }
};
