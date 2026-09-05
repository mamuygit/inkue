import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { FolderService } from "./folder.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";

@Controller("folders")
@UseGuards(JwtAuthGuard)
export class FolderController {
  constructor(private folders: FolderService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.folders.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.folders.create(user.userId, body);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.folders.update(user.userId, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.folders.remove(user.userId, id);
  }
}
