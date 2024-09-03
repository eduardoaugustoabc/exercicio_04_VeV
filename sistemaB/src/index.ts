import app from './server/app';
import { loadPlugins } from './server/plugins';

async function startServer() {
  await loadPlugins();

  await app.listen({
    port: Number(process.env.PORT),
  });
}

startServer();
