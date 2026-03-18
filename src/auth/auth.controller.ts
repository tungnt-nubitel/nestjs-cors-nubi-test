import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ClickToChatTokenDto } from "./dto/click-to-chat-token.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post("click-to-chat/token")
  @HttpCode(HttpStatus.OK)
  async issueClickToChatToken(
    @Body() body: ClickToChatTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      if (!body.campaignId && !body.senderFrom) {
        return {
          ok: false,
          message: "`campaignId` or `senderFrom` is required",
        };
      }

      const { access_token, expiresIn } =
        await this.authService.signClickToChatToken({
          campaignId: body.campaignId,
          senderFrom: body.senderFrom,
        });

      this.authService.setAuthCookie(res, access_token, {
        name: "auth_token_click_to_chat",
        maxAgeMs: expiresIn * 1000,
      });

      return { ok: true };
    } catch (error) {
      this.logger.error(
        `issueClickToChatToken error`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        ok: false,
        message: "Failed to issue token",
      };
    }
  }
}
