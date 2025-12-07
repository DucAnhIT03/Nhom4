import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleName } from "../../shared/schemas/role.schema";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { Request } from "express";

interface RequestWithUser extends Request {
  user?: { id: number; email: string; roles?: RoleName[] };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này");
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này");
    }

    return true;
  }
}


