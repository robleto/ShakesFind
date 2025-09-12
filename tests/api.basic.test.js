/*
 Basic Jest smoke tests placeholder.
 Will expand with DB + Stripe integration coverage.
*/

const { handler } = require('../../netlify/functions/api');

describe('API basic smoke tests', () => {
  test('search wingspan (demo key)', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { s: 'wingspan', apikey: 'demo' },
      path: '/api'
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.Response).toBe('True');
  });
});
