import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

import * as cookieParser from "cookie-parser";
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService)
  
  app.use(cookieParser(config.getOrThrow("COOKIE_SECRET")));
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );
  app.enableCors({
    origin: config.getOrThrow("ORIGIN"),
    credentials: true,
    exposedHeaders: ["set-cookie"],
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
