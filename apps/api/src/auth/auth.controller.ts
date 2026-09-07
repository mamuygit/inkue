import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { CurrentUser, AuthUser } from "./current-user.decorator";

const avatarUpload = FileInterceptor("file", {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

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

  @UseGuards(JwtAuthGuard)
  @Post("avatar")
  @UseInterceptors(avatarUpload)
  uploadAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.auth.uploadAvatar(user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("avatar")
  deleteAvatar(@CurrentUser() user: AuthUser) {
    return this.auth.deleteAvatar(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("avatar-frame")
  setAvatarFrame(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.setAvatarFrame(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("password")
  changePassword(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.changePassword(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("delete")
  deleteAccount(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.deleteAccount(user.userId, body);
  }
}
