// Unified productions data loader (replacing awards-data)
// For now loads from static JSON; later can source from Postgres.

let rawData;
try {
  rawData = require('../data/sample-productions.json');
} catch (e) {
  console.error('Failed to load productions JSON:', e);
  rawData = [];
}

// Normalize & derived fields
const productionsData = rawData.map(p => ({
  ...p,
  start_year: p.start_date ? new Date(p.start_date).getFullYear() : null,
}));

module.exports = productionsData;
