require('reflect-metadata');
require('dotenv').config();

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./modules/app.module');
const { initializePersistentState } = require('./services/barbershop.service');

async function bootstrap() {
  await initializePersistentState();

  const app = await NestFactory.create(AppModule);
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });
  app.use((request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (request.secure || request.headers['x-forwarded-proto'] === 'https') {
      response.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`Solution Barber API running on http://localhost:${port}`);
}

bootstrap();



