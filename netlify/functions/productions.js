const productionsData = require('../../lib/productions-data');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { queryStringParameters = {} } = event;
  const { page = 1, pageSize = 25, orderBy = 'start_date', orderDir = 'asc' } = queryStringParameters;
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
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      Response: 'True',
      totalResults: productionsData.length,
      page: p,
      pageSize: ps,
      orderBy: sortKey,
      orderDir: dir === 1 ? 'asc' : 'desc',
      productions: slice
    })
  };
};
