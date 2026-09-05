import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";

@Controller("stats")
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get("public")
  publicStats() {
    return this.stats.publicStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  mine(
    @CurrentUser() user: AuthUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("days") days?: string,
  ) {
    return this.stats.mine(user.userId, { from, to, days });
  }
}
