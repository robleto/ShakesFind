const db = require('../../config/database');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    // Serve the API key request page
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/apikey.html">
</head>
<body>
  <p>Redirecting to <a href="/apikey.html">API key page</a>...</p>
</body>
</html>`
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { email, name, company, use_case, description } = body;

      if (!email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email is required'
          })
        };
      }

      // Call database function to generate API key
      const result = await db.generateApiKey(email, name, company, use_case, description);

      if (!result.success) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: result.error || 'Failed to generate API key'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };

    } catch (error) {
      console.error('Error generating API key:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      success: false,
      error: 'Method not allowed'
    })
  };
};
