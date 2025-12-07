import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { RoleName } from "../../shared/schemas/role.schema";

interface RequestWithUser extends Request {
  user?: { id: number; email: string; roles?: RoleName[] };
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user ?? null;
});
