import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    if (!req.headers.authorization) return true;
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user ?? (null as TUser);
  }
}
