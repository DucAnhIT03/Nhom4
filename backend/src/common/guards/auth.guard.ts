import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { JwtService } from "@nestjs/jwt";

interface RequestWithUser extends Request {
  user?: { id: number; email: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header || typeof header !== "string") {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid Authorization header format");
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number; email: string }>(token);
      request.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
