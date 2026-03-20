import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ENV_VARS } from "src/app.const";

@Injectable()
export class JwtOrBypassClickToChatGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const token =
      req.cookies?.["auth_token_click_to_chat"] ??
      this.extractBearerToken(req);

    if (token) {
      try {
        const secret =
          this.config.get<string>(ENV_VARS.JWT_CLICK_TO_CHAT_SECRET) ??
          "dev_only_change_me_click_to_chat";
        const payload = await this.jwt.verifyAsync(token, { secret });
        (req as any).user = payload;
        return true;
      } catch {
        // fall through to bypass
      }
    }

    // No valid token — allow through but mark as bypassed
    (req as any).user = { campaignId: "dev-bypass" };
    return true;
  }

  private extractBearerToken(req: Request): string | undefined {
    const auth = req.headers["authorization"];
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
    return undefined;
  }
}
