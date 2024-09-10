import supertest from 'supertest';
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import app from '../src/server/app'; 
import ConversionClient from '../src/clients/ConversionClient';


vi.mock('../src/clients/ConversionClient', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      createConversion: vi.fn(),
      getConversionById: vi.fn(),
    })),
  };
});

const mockedConversionClient = new ConversionClient();

describe('File Sharing', () => {
  beforeEach(async () => {
    mockedConversionClient.createConversion.mockClear();
    mockedConversionClient.getConversionById.mockClear();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('caso 1: arquivo compartilhado com sucesso sem conversão', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'document.txt',
        mode: 'public',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'document.txt',
      mode: 'public',
      originalFile: undefined,
    });
  });

  test('caso 2: arquivo compartilhado com conversão bem-sucedida', async () => {
    const conversion = {
      id: 'conv123',
      state: 'COMPLETED',
      inputFileName: 'document.txt',
      inputFileFormat: 'txt',
      outputFileName: 'document.pdf',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-06T12:00:00Z',
      completedAt: '2024-09-06T12:01:00Z',
    };

    mockedConversionClient.createConversion.mockResolvedValue(conversion);
    mockedConversionClient.getConversionById.mockResolvedValueOnce({
      ...conversion,
      state: 'PENDING',
    });
    mockedConversionClient.getConversionById.mockResolvedValueOnce(conversion);

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'document.txt',
        mode: 'private',
        convertTo: 'pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'document.pdf',
      mode: 'private',
      originalFile: { name: 'document.txt' },
    });
  });

  test('caso 3: erro durante a conversão de arquivo', async () => {
    const conversion = {
      id: 'conv123',
      state: 'ERROR',
      inputFileName: 'document.txt',
      inputFileFormat: 'txt',
      outputFileName: '',
      outputFileFormat: 'pdf',
      createdAt: '2024-09-06T12:00:00Z',
      completedAt: null,
    };

    mockedConversionClient.createConversion.mockResolvedValue(conversion);
    mockedConversionClient.getConversionById.mockResolvedValue(conversion);

    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: 'document.txt',
        mode: 'private',
        convertTo: 'pdf',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Error converting file',
    });
  });

  test('caso 4: erro de validação no compartilhamento de arquivo', async () => {
    const response = await supertest(app.server)
      .post('/shares/files')
      .send({
        name: '', 
        mode: 'public',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
  });
});
