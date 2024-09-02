import fastify from 'fastify';
import { z } from 'zod';
import LocationClient from '../clients/LocationClient';
import { handleServerError } from './errors';
import { calculateShippingCost } from '../utils/shipping';

const app = fastify({
  logger: process.env.NODE_ENV !== 'test',
  disableRequestLogging: process.env.NODE_ENV !== 'development',
});

const api = {
  location: new LocationClient(),
};

const calculateShippingSchema = z.object({
  originCityName: z.string().min(1),
  destinationCityName: z.string().min(1),
  weightInKilograms: z.coerce.number().positive(),
  volumeInLiters: z.coerce.number().positive(),
});

export type CalculateShippingQuery = z.infer<typeof calculateShippingSchema>;

app.get('/shipping/calculate', async (request, reply) => {
  const {
    originCityName,
    destinationCityName,
    weightInKilograms,
    volumeInLiters,
  } = calculateShippingSchema.parse(request.query);

  const [originCities, destinationCities] = await Promise.all([
    api.location.searchCities(originCityName),
    api.location.searchCities(destinationCityName),
  ]);

  const originCityExists = originCities.length === 0;
  if (originCityExists) {
    return reply.status(400).send({ message: 'Origin city not found' });
  }

  const destinationCityExists = destinationCities.length === 0;
  if (destinationCityExists) {
    return reply.status(400).send({ message: 'Destination city not found' });
  }

  const originCity = originCities[0];
  const destinationCity = destinationCities[0];

  const distance = await api.location.calculateDistanceBetweenCities(
    originCity.id,
    destinationCity.id,
  );

  const cost = calculateShippingCost(
    originCity,
    destinationCity,
    distance.kilometers,
    weightInKilograms,
    volumeInLiters,
  );

  const costInCents = Math.ceil(cost * 100);

  return reply.status(200).send({
    distanceInKilometers: distance.kilometers,
    costInCents,
  });
});

app.setErrorHandler(handleServerError);

export default app;
