import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import * as path from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({ crossOriginResourcePolicy: false }));

  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // Настройка CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://stage.ta-da.co'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    })
  );

  const swaggerCfg = new DocumentBuilder()
    .setTitle("TaDa Rental Platform API")
    .setDescription("API for connecting tenants and property operators")
    .setVersion("1.0")
    .addBearerAuth(
      {
        description: "JWT Bearer. Пример: 'Bearer 12345abcdef'",
        name: "Authorization",
        bearerFormat: "JWT",
        scheme: "Bearer",
        type: "http",
        in: "Header",
      },
      "access-token"
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT ?? 5001;
  await app.listen(port, "0.0.0.0");

  console.log(`Tada server is running on: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
