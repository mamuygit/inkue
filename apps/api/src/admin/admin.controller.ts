import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AdminGuard } from "../auth/admin.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("overview")
  overview(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("days") days?: string,
  ) {
    return this.admin.overview({ from, to, days });
  }

  @Get("users")
  users(@Query("q") q?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listUsers({ q, page, limit });
  }

  @Get("users/:id")
  user(@Param("id") id: string) {
    return this.admin.getUser(id);
  }

  @Get("qr")
  qrList(@Query("q") q?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.admin.listQr({ q, page, limit });
  }

  @Get("qr/:id/stats")
  qrStats(
    @Param("id") id: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("days") days?: string,
  ) {
    return this.admin.qrStats(id, { from, to, days });
  }

  @Get("qr/:id")
  qr(@Param("id") id: string) {
    return this.admin.getQr(id);
  }

  @Get("donates")
  donates(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("days") days?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.admin.listDonates({ from, to, days, page, limit });
  }
}
