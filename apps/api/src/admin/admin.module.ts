import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DonateClick, QrCode, QrScan, User } from "../db/entities";
import { SpacesModule } from "../spaces/spaces.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, QrCode, QrScan, DonateClick]), SpacesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
