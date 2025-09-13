const request = require('supertest');
const app = require('../server');

// Basic test ensures filtering by city and ordering does not error and returns expected shape

describe('Production search filters', () => {
  test('search by city filter', async () => {
    const res = await request(app)
      .get('/api/')
      .query({ s: 'London', city: 'London', apikey: 'demo' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('Response', 'True');
    expect(res.body).toHaveProperty('productions');
    expect(Array.isArray(res.body.productions)).toBe(true);
    if (res.body.productions.length) {
      const first = res.body.productions[0];
      expect(first).toHaveProperty('play_title');
      expect(first).toHaveProperty('city');
    }
  });
});
