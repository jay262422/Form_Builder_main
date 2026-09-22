const request = require('supertest');
const createApp = require('../app');

describe('Form Management Service', () => {
  const app = createApp();

  test('GET /health returns healthy response', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('Form Management Service');
  });

  test('POST /api/auth/login validates payload', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.status).toBe('validation_error');
  });

  test('GET /unknown-route returns standardized not found', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
