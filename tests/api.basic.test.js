/*
 Basic Jest smoke tests placeholder.
 Will expand with DB + Stripe integration coverage.
*/

const path = require('path');
const { handler } = require(path.join(process.cwd(), 'netlify/functions/api.js'));

describe('API basic smoke tests', () => {
  test('search hamlet (demo key)', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { s: 'hamlet', apikey: 'demo' },
      path: '/api'
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.Response).toBe('True');
  });
});
