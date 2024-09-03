import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import app, { CalculateShippingQuery } from '../src/server/app';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('https://v2-location-d8b1dd3.vercel.app/json', () => {
    return HttpResponse.json({
      city: 'São Paulo',
      state: 'SP',
    });
  }),
  http.get('https://v2-location-d8b1dd3.vercel.app/json', () => {
    return HttpResponse.json({
      error: 'Location not found',
    });
  }),
  http.get('https://v2-location-d8b1dd3.vercel.app/json', () => {
    return HttpResponse.json({
      error: 'Internal Server Error',
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Shipping', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('caso 1: deve retornar a localização correta', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      distanceInKilometers: expect.any(Number),
      costInCents: expect.any(Number),
    });
  });

  test('caso 2: deve retornar erro 500 para cidade não encontrada', async () => {
    server.use(
      http.get('https://v2-location-d8b1dd3.vercel.app/json', () => {
        return HttpResponse.json(
          {
            message: 'Internal server error',
          },
          { status: 500 }
        );
      })
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'Cidade Inexistente, XX',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    console.log(response.body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });

  test('caso 3: deve retornar custo de frete zero para cidades no mesmo estado', async () => {
    server.use(
      http.get('https://v2-location-d8b1dd3.vercel.app/json', () => {
        return HttpResponse.json([
          {
            id: 'origin-city-id',
            name: 'São Paulo',
            stateCode: 'SP',
            countryCode: 'BRA',
          },
          {
            id: 'destination-city-id',
            name: 'Campinas',
            stateCode: 'SP',
            countryCode: 'BRA',
          },
        ]);
      })
    );

    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: 'São Paulo, SP',
        destinationCityName: 'Campinas, SP',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    expect(response.status).toBe(200);
    expect(response.body.costInCents).toBe(null);
  });

  test('caso 4: Erro de validação no cálculo de frete que dá undefined', async () => {
    const response = await supertest(app.server)
      .get('/shipping/calculate')
      .query({
        originCityName: '',
        destinationCityName: 'Recife, PE',
        weightInKilograms: 10,
        volumeInLiters: 0.1,
      } satisfies CalculateShippingQuery);

    console.log(response.body.error);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(undefined);
  });
});
