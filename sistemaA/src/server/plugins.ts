import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import path from 'path';

import app from './app';

const ROOT_DIRECTORY = path.resolve(__dirname, '..', '..');
const OPENAPI_SPEC_DIRECTORY = path.join(ROOT_DIRECTORY, 'docs', 'spec');

export async function loadPlugins() {
  await app.register(swagger, {
    mode: 'static',
    specification: {
      path: path.join(OPENAPI_SPEC_DIRECTORY, 'openapi.yaml'),
      baseDir: OPENAPI_SPEC_DIRECTORY,
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/',
    uiConfig: {
      docExpansion: 'list',
      displayRequestDuration: true,
    },
    theme: {
      title: 'Sistema de Entregas',
      css: [
        {
          filename: 'custom.css',
          content: '.swagger-ui .topbar { display: none; }',
        },
      ],
    },
  });
}
