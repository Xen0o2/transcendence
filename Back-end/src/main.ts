import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: `${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
  })

  const io = require('socket.io')(app.getHttpServer(), {
    cors: {
      origin: `${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`, // ici changer l'adresse IP
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.useWebSocketAdapter(new IoAdapter(io));
  app.enableCors();

  await app.listen(process.env.BACKEND_PORT);
}
bootstrap();
