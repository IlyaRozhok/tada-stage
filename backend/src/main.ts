import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import * as cors from "cors";
import * as path from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Set request body size limits
  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // Статическая раздача файлов для uploads
  const uploadsPath =
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "..", "uploads")
      : path.join(process.cwd(), "uploads");

  // Static file serving for /uploads has been removed for production readiness.
  // Consider using a dedicated static file server (e.g., Nginx, S3, CDN) for serving uploads in production.

  app.enableCors({
    origin: ["https://tada.illiacodes.dev", "http://localhost:3000"],
    credentials: false,
  });

  // Set global prefix for all routes
  app.setGlobalPrefix("api");

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Временно разрешаем дополнительные поля
      transform: true,
    })
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle("TaDa Rental Platform API")
    .setDescription("API for connecting tenants and property operators")
    .setVersion("1.0")
    .addBearerAuth(
      {
        description: `JWT Authorization header using the Bearer scheme.
        Enter 'Bearer' [space] and then your token in the text input below.
        Example: "Bearer 12345abcdef"`,
        name: "Authorization",
        bearerFormat: "JWT",
        scheme: "Bearer",
        type: "http",
        in: "Header",
      },
      "access-token"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 5001;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
