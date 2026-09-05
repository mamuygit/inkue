import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { CurrentUser, AuthUser } from "./current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  register(@Body() body: unknown, @Req() req: Request) {
    return this.auth.register(body, req);
  }

  @Post("login")
  login(@Body() body: unknown) {
    return this.auth.login(body);
  }

  @Post("otp/request")
  requestOtp(@Body() body: unknown, @Req() req: Request) {
    return this.auth.requestOtp(body, req);
  }

  @Post("otp/verify")
  verifyOtp(@Body() body: unknown) {
    return this.auth.verifyOtp(body);
  }

  @Post("password/request")
  requestPasswordReset(@Body() body: unknown, @Req() req: Request) {
    return this.auth.requestPasswordReset(body, req);
  }

  @Post("password/reset")
  resetPassword(@Body() body: unknown) {
    return this.auth.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
