/*eslint-disable*/
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { urlencoded, json } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
     allowedHeaders: '*',
     origin: '*',
   });
  app.useGlobalPipes(new ValidationPipe());
  
   app.use(cookieParser());
 app.use(json({ limit: '250mb' }));
 app.use(urlencoded({ extended: true, limit: '250mb' }));
 
  
 // app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  await app.listen(4000);
}
bootstrap();
