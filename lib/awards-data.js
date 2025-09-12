// Unified awards data loader.
// Tries to load the full private dataset from internal/ (gitignored) and
// falls back to the public sample dataset tracked in the repo.
// Processing mirrors the earlier dev-scripts/awards-data.js implementation.

let rawData;
try {
  // Private full dataset (not in repo)
  rawData = require('../internal/enhanced-honors-complete.json');
  // eslint-disable-next-line no-console
  console.log('📦 Loaded full private dataset (internal)');
} catch (_) {
  rawData = require('../data/sample-awards.json');
  // eslint-disable-next-line no-console
  console.log('📦 Loaded sample dataset (public)');
}

const awardsData = rawData.map(award => ({
  ...award,
  year: award.year ? parseInt(award.year) : null,
  boardgames: award.boardgames || [],
  isWinner: award.title ? award.title.toLowerCase().includes('winner') : false,
  isNominee: award.title ? (award.title.toLowerCase().includes('nominee') || award.title.toLowerCase().includes('nom')) : false,
  title: award.title ? award.title.trim() : '',
  awardSet: award.awardSet ? award.awardSet.trim() : '',
  position: award.position ? award.position.trim() : ''
}));

// Minimal export (indices can be re-added when DB-backed search arrives)
module.exports = awardsData;
