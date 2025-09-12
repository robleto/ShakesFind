const awardsData = require('../../lib/awards-data');

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
    const categories = [...new Set(awardsData.map(award => award.position).filter(Boolean))].sort();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        Response: "True",
        totalResults: categories.length,
        categories: categories
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        Response: "False",
        Error: "Internal server error"
      })
    };
  }
};
