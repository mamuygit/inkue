import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DonateClick, Folder, OtpChallenge, OtpDailyLimit, QrCode, QrScan, User } from "./entities";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres" as const,
        url: process.env.DATABASE_URL,
        entities: [User, OtpChallenge, OtpDailyLimit, Folder, QrCode, QrScan, DonateClick],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, OtpChallenge, OtpDailyLimit, Folder, QrCode, QrScan, DonateClick]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
