import "./load-env";
import "reflect-metadata";
import { BRAND } from "@mamuy/shared";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ZodExceptionFilter } from "./common/zod.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "r/:hash", method: RequestMethod.GET },
    ],
  });
  app.useGlobalFilters(new ZodExceptionFilter());
  const http = app.getHttpAdapter().getInstance();
  if (http?.set) http.set("trust proxy", 1);
  const origins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "https://qr.mamuy.dev",
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`${BRAND.name} API listening on ${port}`);
}

bootstrap();
