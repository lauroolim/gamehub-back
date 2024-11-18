import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);


    const config = new DocumentBuilder()
      .setTitle('GameHub API')
      .setDescription('GameHub API Documentation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
    app.use('/api/mercadopago/webhook', express.raw({ type: 'application/json' }));
    app.enableCors();
    app.setGlobalPrefix('/api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    app.getHttpAdapter().get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    const port = parseInt(process.env.PORT, 10) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on port ${port}`);

    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, async () => {
        try {
          await app.close();
          console.log('Application closed gracefully');
          process.exit(0);
        } catch (err) {
          console.error('Error during graceful shutdown:', err);
          process.exit(1);
        }
      });
    }

  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();