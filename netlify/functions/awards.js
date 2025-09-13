exports.handler = async () => ({
  statusCode: 410,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Response: 'False',
    Error: 'Deprecated endpoint. Use /productions instead.'
  })
});
