import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function main() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1'); // prefijo global de todos los endpoints

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger / OpenAPI — documentación interactiva de los endpoints.
  const config = new DocumentBuilder()
    .setTitle('Wonder Chicken API')
    .setDescription('Backend del sistema de ventas Wonder Chicken V1')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT ?? 4000;
  await app.listen(PORT);

  logger.log(`wonderChicken backend is running in ${PORT}`);

  logger.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
}
void main();
