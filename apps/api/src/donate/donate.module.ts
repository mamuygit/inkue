import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DonateClick } from "../db/entities";
import { DonateController } from "./donate.controller";

@Module({
  imports: [TypeOrmModule.forFeature([DonateClick])],
  controllers: [DonateController],
})
export class DonateModule {}
