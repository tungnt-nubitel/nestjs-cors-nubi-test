// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

import * as cookieParser from "cookie-parser";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Cookies
  app.use(cookieParser());

  // ✅ Body size limits
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  // ✅ Build allowed CORS origins
  const corsOrigins = (
    process.env.cors ? process.env.cors.split(",").map((o) => o.trim()) : []
  ).filter(Boolean);

  // ✅ Always allow local dev
  if (!corsOrigins.includes("https://localhost:8080")) {
    corsOrigins.push("https://localhost:8080");
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / Postman
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        // ✅ Echo exact origin (REQUIRED for credentials)
        return callback(null, true);
      }

      // ✅ IMPORTANT: do NOT throw error → browser handles CORS
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    maxAge: 600,
  });

  // ✅ Cache-safety behind proxies
  app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
  });

  // ✅ Global validation (recommended)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3400);
  console.log("API running at http://localhost:3400");
}

bootstrap();
