import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Folder, OtpChallenge, OtpDailyLimit, QrCode, QrScan, User } from "./entities";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres" as const,
        url: process.env.DATABASE_URL,
        entities: [User, OtpChallenge, OtpDailyLimit, Folder, QrCode, QrScan],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, OtpChallenge, OtpDailyLimit, Folder, QrCode, QrScan]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
