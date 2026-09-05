import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QrCode, QrScan } from "../db/entities";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  imports: [TypeOrmModule.forFeature([QrCode, QrScan])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
