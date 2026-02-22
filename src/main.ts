import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { seedAdminUser, seedBoards } from './db/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'https://d359limanz0pmj.cloudfront.net',
      'https://hibot-docu.com',
      'https://www.hibot-docu.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Hibot Docu API')
    .setDescription('The Hibot Document Management API description')
    .setVersion('1.0')
    .addTag('auth')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Seed data
  console.log('[Seed] 데이터베이스 초기화 시작...');
  await seedAdminUser();
  await seedBoards();
  console.log('[Seed] 데이터베이스 초기화 완료.');

  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
