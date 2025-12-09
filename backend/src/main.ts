import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend admin và user app gọi API từ origin khác
  app.enableCors({
    origin: [
      "http://localhost:5173", // User app (Vite)
      "http://localhost:5174", // Admin app (Vite) - giữ lại để tương thích
      "http://localhost:5175", // Admin app (Vite) - port mới
      "http://localhost:3000", // Backend/Swagger
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Cho phép các field không được định nghĩa trong DTO
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cấu hình Swagger (tài liệu API) với tiếng Việt
  const config = new DocumentBuilder()
    .setTitle("Tài liệu API hệ thống nghe nhạc")
    .setDescription("Swagger UI thử nghiệm và kiểm thử các API backend (tiếng Việt).")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập access token dạng: Bearer <token>",
      },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document, {
    swaggerOptions: {
      docExpansion: "none",
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  const appUrl = await app.getUrl();
  logger.log(`Swagger UI đang chạy tại: ${appUrl}/api-docs`);
}
bootstrap();
