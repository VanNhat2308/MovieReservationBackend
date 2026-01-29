import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;


  const config = new DocumentBuilder()
    .setTitle('Movie Reservation API')
    .setDescription('API documentation for the Movie Reservation System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ token sau refresh trang
      tagsSorter: 'alpha', // Sắp xếp tag theo alphabet
      operationsSorter: 'alpha', // Sắp xếp operation theo alphabet
      docExpansion: 'none', // Mặc định collapse tất cả
      filter: true, // Cho phép search/filter
      tryItOutEnabled: true, // Bật "Try it out" mặc định
    },
    customSiteTitle: 'Movie Reservation API Docs',
  });

  await app.listen(port);
}
bootstrap();
