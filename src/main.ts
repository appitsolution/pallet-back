import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import payload from 'payload';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressInstance = app.getHttpAdapter().getInstance();
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: expressInstance,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  await app.listen(3000);
}
bootstrap();
