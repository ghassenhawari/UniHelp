import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const supertest = request.default || request;

describe('UniHelp API — E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Health ──────────────────────────────────────────────────────

  describe('GET /api/health/ping', () => {
    it('should return pong', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/health/ping')
        .expect(200);

      expect(res.body).toMatchObject({
        status: 'ok',
        message: 'pong',
      });
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should return health status object', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('services');
      expect(res.body.services).toHaveProperty('api');
      expect(res.body.services).toHaveProperty('ollama');
      expect(res.body.services).toHaveProperty('chromadb');
      expect(['ok', 'degraded', 'error']).toContain(res.body.status);
    });
  });

  // ── Q&A ─────────────────────────────────────────────────────────

  describe('POST /api/qa/ask', () => {
    it('should reject empty question', async () => {
      await supertest(app.getHttpServer())
        .post('/api/qa/ask')
        .send({ question: '' })
        .expect(400);
    });

    it('should reject question over 1000 chars', async () => {
      await supertest(app.getHttpServer())
        .post('/api/qa/ask')
        .send({ question: 'A'.repeat(1001) })
        .expect(400);
    });

    it('should reject invalid topK value', async () => {
      await supertest(app.getHttpServer())
        .post('/api/qa/ask')
        .send({ question: 'Test question ?', topK: 100 })
        .expect(400);
    });

    it('should return answer with expected shape', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/qa/ask')
        .send({
          question: 'comment obtenir une attestation de scolarité ?',
          topK: 3,
          lang: 'fr',
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('sources');
      expect(res.body).toHaveProperty('confidence');
      expect(res.body).toHaveProperty('found');
      expect(Array.isArray(res.body.sources)).toBe(true);
      expect(typeof res.body.confidence).toBe('number');
      expect(res.body.confidence).toBeGreaterThanOrEqual(0);
      expect(res.body.confidence).toBeLessThanOrEqual(1);
    });

    it('should return not-found message when no docs indexed', async () => {
      // If DB is empty, should return the "not found" message
      const res = await supertest(app.getHttpServer())
        .post('/api/qa/ask')
        .send({
          question: 'xyzzy quizgabfunkel impossible question 12345',
          topK: 3,
          lang: 'fr',
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('found');
      // found should be boolean regardless
      expect(typeof res.body.found).toBe('boolean');
    });
  });

  // ── Emails ──────────────────────────────────────────────────────

  describe('GET /api/emails/types', () => {
    it('should return email types list', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/api/emails/types')
        .expect(200);

      expect(res.body).toHaveProperty('types');
      expect(Array.isArray(res.body.types)).toBe(true);
      expect(res.body.types.length).toBeGreaterThan(0);
      expect(res.body.types[0]).toHaveProperty('id');
      expect(res.body.types[0]).toHaveProperty('label');
    });
  });

  describe('POST /api/emails/generate', () => {
    const validPayload = {
      emailType: 'attestation',
      studentInfo: {
        fullName: 'Test Student',
        studentId: '20240001',
        department: 'Informatique',
        level: 'Master 1',
      },
      lang: 'fr',
    };

    it('should generate email with subject and body', async () => {
      const res = await supertest(app.getHttpServer())
        .post('/api/emails/generate')
        .send(validPayload)
        .expect(200);

      expect(res.body).toHaveProperty('subject');
      expect(res.body).toHaveProperty('body');
      expect(res.body).toHaveProperty('emailType', 'attestation');
      expect(res.body).toHaveProperty('generatedAt');
      expect(typeof res.body.subject).toBe('string');
      expect(typeof res.body.body).toBe('string');
      expect(res.body.subject.length).toBeGreaterThan(0);
    }, 60000); // 60s timeout for LLM

    it('should reject invalid emailType', async () => {
      await supertest(app.getHttpServer())
        .post('/api/emails/generate')
        .send({ ...validPayload, emailType: 'invalid_type' })
        .expect(400);
    });

    it('should reject missing studentInfo', async () => {
      await supertest(app.getHttpServer())
        .post('/api/emails/generate')
        .send({ emailType: 'attestation' })
        .expect(400);
    });
  });

  // ── Docs (Admin) ────────────────────────────────────────────────

  describe('POST /api/docs/upload', () => {
    it('should reject request without admin secret', async () => {
      await supertest(app.getHttpServer())
        .post('/api/docs/upload')
        .expect(401);
    });

    it('should reject non-admin secret', async () => {
      await supertest(app.getHttpServer())
        .post('/api/docs/upload')
        .set('X-Admin-Secret', 'wrong_secret')
        .expect(401);
    });
  });

  describe('GET /api/docs', () => {
    it('should reject without admin secret', async () => {
      await supertest(app.getHttpServer())
        .get('/api/docs')
        .expect(401);
    });
  });
});
