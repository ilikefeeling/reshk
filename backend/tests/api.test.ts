import request from 'supertest';
import { app, server } from '../src/index';

describe('API Health Check', () => {
    afterAll(async () => {
        // Close the server if it was opened (though it shouldn't be in test mode)
        if (server && server.listening) {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
    });

    it('should return 200 OK for /api/health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'OK');
    });

    it('should return 404 for non-existent routes', async () => {
        const res = await request(app).get('/api/non-existent-route');
        expect(res.statusCode).toEqual(404);
    });
});
