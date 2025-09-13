const path = require('path');
const { handler } = require(path.join(process.cwd(), 'netlify/functions/productions.js'));

describe('Productions pagination', () => {
  test('page & pageSize work', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { page: '1', pageSize: '2' }
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.productions.length).toBeLessThanOrEqual(2);
    expect(body.page).toBe(1);
  });

  test('ordering desc by play_title', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { orderBy: 'play_title', orderDir: 'desc' }
    };
    const res = await handler(event);
    const body = JSON.parse(res.body);
    const titles = body.productions.map(p => p.play_title);
    const sorted = [...titles].sort().reverse();
    expect(titles[0]).toBe(sorted[0]);
  });
});
