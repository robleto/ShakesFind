const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load productions data
const productionsData = require('./lib/productions-data');
let dbClient = null;
if (process.env.USE_DB === '1') {
  try {
    dbClient = require('@neondatabase/serverless');
  } catch (e) {
    console.warn('DB search enabled but Neon client not available');
  }
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting - similar to OMDB's approach
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    Response: "False",
    Error: "Request limit exceeded"
  }
});
app.use('/api/', limiter);

// Static files for landing page
app.use(express.static('public'));

// API Routes

// Landing page route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Documentation route
app.get('/docs', (req, res) => {
  res.sendFile(__dirname + '/public/docs.html');
});

// API key request route
app.get('/apikey', (req, res) => {
  res.sendFile(__dirname + '/public/apikey.html');
});

// Main API endpoint - Get production by ID / search
app.get('/api/', (req, res) => {
  const { i: productionId, t: title, s: search, year, company, status, city, country, r: format = 'json' } = req.query;
  
  // Require API key for production
  const apiKey = req.query.apikey;
  if (process.env.NODE_ENV === 'production' && !apiKey) {
    return res.status(401).json({
      Response: "False",
  Error: "No API key provided. Request API key at https://shakesfind.com/apikey"
    });
  }

  try {
    let result;

    if (search) {
      if (process.env.USE_DB === '1' && dbClient) {
        result = { Response: 'True', ...(res.locals || {}), ...( { productions: [], totalResults: 0 } ) };
        // Simple SQL search (placeholder) - implement real query later
        // Keeping identical shape to in-memory result if empty
        // TODO: Implement actual SQL FTS using to_tsvector index
  const { getPool } = require('./lib/db-pool');
  const pool = getPool();
        // Basic ILIKE fallback for now
        const params = [];
        params.push(search);
        let where = "WHERE search_vector @@ plainto_tsquery('english', $1)";
        if (year) { params.push(year); where += ` AND EXTRACT(YEAR FROM start_date) = $${params.length}`; }
        if (company) { params.push('%'+company+'%'); where += ` AND company_name ILIKE $${params.length}`; }
        if (status) { params.push(status); where += ` AND status = $${params.length}`; }
        if (city) { params.push(city); where += ` AND LOWER(city)=LOWER($${params.length})`; }
        if (country) { params.push(country); where += ` AND LOWER(country)=LOWER($${params.length})`; }
        try {
          pool.query(`SELECT id, play_title, company_name, venue_name, city, country, start_date, end_date, status, ticket_url, official_url, synopsis, ts_rank(search_vector, plainto_tsquery('english',$1)) AS rank FROM productions ${where} ORDER BY rank DESC, start_date DESC LIMIT 50`, params)
            .then(r => {
              result = { Response: 'True', totalResults: r.rowCount, search, productions: r.rows };
              res.json(result);
            })
            .catch(err => {
              console.error('SQL search error', err);
              res.json(searchProductions(search, { year, company, status, city, country }));
            });
          return; // prevent double send
        } catch (e) {
          console.error('DB search failed, falling back', e);
        }
      }
      result = searchProductions(search, { year, company, status, city, country });
    } else if (productionId) {
      result = getProductionById(productionId);
    } else if (title) {
      result = getProductionsByTitle(title, { year, company });
    } else {
      return res.status(400).json({
        Response: "False",
        Error: "Incorrect parameters. Provide 'i' (production ID), 't' (play title) or 's' (search)."
      });
    }

    if (format === 'xml') {
      // TODO: Implement XML response format
      return res.status(501).json({
        Response: "False",
        Error: "XML format not yet implemented"
      });
    }

    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      Response: "False",
      Error: "Internal server error"
    });
  }
});

// Get productions by start year
app.get('/api/years/:year', (req, res) => {
  const { year } = req.params;
  const yearProductions = productionsData.filter(p => p.start_year == year);
  res.json({
    Response: yearProductions.length > 0 ? "True" : "False",
    totalResults: yearProductions.length,
    year: year,
    productions: yearProductions
  });
});

// List productions (basic pagination later)
app.get('/api/productions', (req, res) => {
  const {
    page = 1,
    pageSize = 25,
    orderBy = 'start_date',
    orderDir = 'asc'
  } = req.query;

  const validOrderBy = new Set(['start_date','end_date','play_title','city','status']);
  const sortKey = validOrderBy.has(orderBy) ? orderBy : 'start_date';
  const dir = orderDir === 'desc' ? -1 : 1;

  const sorted = [...productionsData].sort((a,b) => {
    const av = a[sortKey] || '';
    const bv = b[sortKey] || '';
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const p = Math.max(1, parseInt(page));
  const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
  const start = (p - 1) * ps;
  const slice = sorted.slice(start, start + ps);

  res.json({
    Response: 'True',
    totalResults: productionsData.length,
    page: p,
    pageSize: ps,
    orderBy: sortKey,
    orderDir: dir === 1 ? 'asc' : 'desc',
    productions: slice
  });
});


// Helper functions
function getProductionById(id) {
  const production = productionsData.find(p => p.id === id);
  if (!production) {
    return { Response: "False", Error: "Production not found!" };
  }
  return { Response: "True", ...production };
}

function getProductionsByTitle(title, filters = {}) {
  let results = productionsData.filter(p => 
    p.play_title && p.play_title.toLowerCase().includes(title.toLowerCase())
  );
  if (filters.year) {
    results = results.filter(p => p.start_year == filters.year);
  }
  if (filters.company) {
    results = results.filter(p => p.company_name && p.company_name.toLowerCase().includes(filters.company.toLowerCase()));
  }
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    Response: "False",
    Error: "Endpoint not found"
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    Response: "False",
    Error: "Internal server error"
  });
});

if (process.env.JEST_WORKER_ID === undefined) {
  const startServer = (portToUse) => {
    const server = app.listen(portToUse, () => {
      console.log(`🎭 Shakespeare Productions API server running on port ${portToUse}`);
      console.log(`📊 Loaded ${productionsData.length} productions`);
      console.log(`🌐 API endpoint: http://localhost:${portToUse}/api/`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (process.env.NODE_ENV === 'production') {
          console.error(`Port ${portToUse} in use. Set PORT env var to a free port.`);
          process.exit(1);
        } else {
          const nextPort = Number(portToUse) + 1;
            console.warn(`Port ${portToUse} in use. Trying ${nextPort}...`);
            startServer(nextPort);
        }
      } else {
        console.error('Server listen error:', err);
        process.exit(1);
      }
    });
  };
  startServer(PORT);
}

module.exports = app;
