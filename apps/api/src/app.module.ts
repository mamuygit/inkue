import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "path";
import { DatabaseModule } from "./db/database.module";
import { MailModule } from "./mail/mail.module";
import { SpacesModule } from "./spaces/spaces.module";
import { AuthModule } from "./auth/auth.module";
import { QrModule } from "./qr/qr.module";
import { FolderModule } from "./folders/folder.module";
import { StatsModule } from "./stats/stats.module";
import { RedirectModule } from "./redirect/redirect.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, "../../../.env"),
        resolve(process.cwd(), "../../.env"),
        resolve(process.cwd(), ".env"),
      ],
    }),
    DatabaseModule,
    MailModule,
    SpacesModule,
    AuthModule,
    QrModule,
    FolderModule,
    StatsModule,
    RedirectModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
