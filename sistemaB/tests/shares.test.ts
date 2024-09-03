import supertest from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import app, { ShareFileQuery } from '../src/server/app';

describe('Shares', () => {
  beforeAll(async () => {
    await app.ready();
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  afterAll(async () => {
    await app.close();
  });

  test.skip('exemplo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'example.docx',
        mode: 'public',
      } satisfies ShareFileQuery);

    expect(response.status).toBe(200);
    console.log(response.body);
  });

  test('caso 1: <descrição>', async () => {
    // Implemente aqui...
  });

  test('caso 2: <descrição>', async () => {
    // Implemente aqui...
  });

  test('caso 3: <descrição>', async () => {
    // Implemente aqui...
  });

  test('caso 4: <descrição>', async () => {
    // Implemente aqui...
  });
});
