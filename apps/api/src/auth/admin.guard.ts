import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { isSuperadminEmail } from "../common/superadmin";
import type { AuthUser } from "./current-user.decorator";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!isSuperadminEmail(req.user?.email)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
