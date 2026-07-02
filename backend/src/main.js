require('reflect-metadata');
require('dotenv').config();

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./modules/app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`Solution Barber API running on http://localhost:${port}`);
}

bootstrap();
