import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

interface RequestWithUser extends Request {
  user?: { id: number; email: string };
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user ?? null;
});
