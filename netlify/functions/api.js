const db = require('../../config/database');

// Load productions data (temporary JSON source)
const productionsData = require('../../lib/productions-data');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { queryStringParameters: query } = event;
    
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          Response: "False",
          Error: "No parameters provided. Provide 'i' (production ID), 't' (play title) or 's' (search)."
        })
      };
    }

  const { i: productionId, t: title, s: search, year, company, status, city, country, r: format = 'json', apikey } = query;

    // Check API key in production
    if (process.env.NETLIFY_DEV !== 'true' && !apikey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          Response: "False",
          Error: "No API key provided. Get your free API key at https://shakesfind.com/apikey"
        })
      };
    }

    // Validate API key if provided
    if (apikey && apikey !== 'demo') {
      try {
        const validation = await db.validateApiKey(apikey);
        if (!validation.valid) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              Response: "False",
              Error: validation.error || "API key validation failed",
              RemainingRequests: validation.requests_remaining_today || 0,
              MonthlyLimit: validation.monthly_limit || 1000
            })
          };
        }
        // Add usage info to response headers
        headers['X-RateLimit-Remaining-Daily'] = validation.requests_remaining_today || 0;
        headers['X-RateLimit-Remaining-Monthly'] = validation.requests_remaining_month || 0;
        headers['X-RateLimit-Tier'] = validation.tier || 'free';
      } catch (e) {
        console.error('API key validation error:', e);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            Response: "False",
            Error: "API key validation failed"
          })
        };
      }
    }

    let result;

    if (search) {
      if (process.env.USE_DB === '1' && process.env.DATABASE_URL) {
        const { getPool } = require('../../lib/db-pool');
        const pool = getPool();
        const params = [];
        // Use plainto_tsquery for simple FTS; fallback to ILIKE patterns
        params.push(search);
        let where = 'WHERE search_vector @@ plainto_tsquery(\'english\', $1)';
        if (year) { params.push(year); where += ` AND EXTRACT(YEAR FROM start_date) = $${params.length}`; }
        if (company) { params.push('%'+company+'%'); where += ` AND company_name ILIKE $${params.length}`; }
        if (status) { params.push(status); where += ` AND status = $${params.length}`; }
        if (city) { params.push(city); where += ` AND LOWER(city)=LOWER($${params.length})`; }
        if (country) { params.push(country); where += ` AND LOWER(country)=LOWER($${params.length})`; }
        try {
          const r = await pool.query(`SELECT id, play_title, company_name, venue_name, city, country, start_date, end_date, status, ticket_url, official_url, synopsis, ts_rank(search_vector, plainto_tsquery('english',$1)) AS rank FROM productions ${where} ORDER BY rank DESC, start_date DESC LIMIT 50`, params);
          result = { Response: 'True', totalResults: r.rowCount, search, productions: r.rows };
        } catch (e) {
          console.error('DB FTS failed, fallback to memory', e);
          result = searchProductions(search, { year, company, status, city, country });
        }
      } else {
        result = searchProductions(search, { year, company, status, city, country });
      }
    } else if (productionId) {
      result = getProductionById(productionId);
    } else if (title) {
      result = getProductionsByTitle(title, { year, company });
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          Response: "False",
          Error: "Incorrect parameters. Provide 'i' (production ID), 't' (play title) or 's' (search)."
        })
      };
    }

    // Log API usage to Neon
    if (apikey && apikey !== 'demo') {
      try {
        await db.logApiUsage(apikey, event.path, query);
      } catch (e) {
        console.error('Failed to log API usage to Neon:', e);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API Error:', error);
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

// Helper functions (same as original server.js)
function getProductionById(id) {
  const production = productionsData.find(p => p.id === id);
  if (!production) return { Response: "False", Error: "Production not found!" };
  return { Response: "True", ...production };
}

function getProductionsByTitle(title, filters = {}) {
  let results = productionsData.filter(p => p.play_title && p.play_title.toLowerCase().includes(title.toLowerCase()));
  if (filters.year) results = results.filter(p => p.start_year == filters.year);
  if (filters.company) results = results.filter(p => p.company_name && p.company_name.toLowerCase().includes(filters.company.toLowerCase()));
  if (results.length === 0) return { Response: "False", Error: "Production not found!" };
  if (results.length === 1) return { Response: "True", ...results[0] };
  return { Response: "True", totalResults: results.length, productions: results };
}

function searchProductions(searchTerm, filters = {}) {
  let results = productionsData.filter(p => {
    const playMatch = p.play_title && p.play_title.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = p.company_name && p.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const venueMatch = p.venue_name && p.venue_name.toLowerCase().includes(searchTerm.toLowerCase());
    const cityMatch = p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase());
    return playMatch || companyMatch || venueMatch || cityMatch;
  });
  if (filters.year) results = results.filter(p => p.start_year == filters.year);
  if (filters.company) results = results.filter(p => p.company_name && p.company_name.toLowerCase().includes(filters.company.toLowerCase()));
  if (filters.status) results = results.filter(p => p.status === filters.status);
  if (filters.city) results = results.filter(p => p.city && p.city.toLowerCase() === filters.city.toLowerCase());
  if (filters.country) results = results.filter(p => p.country && p.country.toLowerCase() === filters.country.toLowerCase());
  if (results.length === 0) return { Response: "False", Error: "No productions found!" };
  return { Response: "True", totalResults: results.length, search: searchTerm, productions: results.slice(0, 10) };
}

// Log API usage wrapper (uses Neon db helper)
async function logApiUsage(apiKey, endpoint, params) {
  try {
    await db.logApiUsage(apiKey, endpoint, params, null, 200, 'unknown', 'netlify-function');
  } catch (error) {
    console.error('Failed to log API usage via db helper:', error);
  }
}
