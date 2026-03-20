import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ClickToChatTokenDto } from "./dto/click-to-chat-token.dto";
import { AuthService } from "./auth.service";
import { JwtOrBypassClickToChatGuard } from "./jwt-or-bypass-click-to-chat.guard";

@Controller("v1/socket-chat")
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
        httpOnly: true,
        secure: true,
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

  @Get("conversation/:conversationId")
  @UseGuards(JwtOrBypassClickToChatGuard)
  async getIntegration(
    @Param("conversationId") conversationId: string,
    @Req() req: Request,
  ) {
    return {
      id: "dummy-id",
      tenant: "dummy-tenant",
      interactionId: "dummy-interaction-id",
      campaignId: "dummy-campaign-id",
      conversationId,
      ivrDisplayId: "dummy-ivr-display-id",
      chatChannelId: "dummy-chat-channel-id",
      sendTo: "dummy-send-to",
      senderId: "dummy-sender-id",
      senderFrom: "dummy-sender-from",
      senderName: "dummy-sender-name",
      senderSource: "dummy-sender-source",
      createdAt: null,
      conversation: null,
      jwtValidated: (req as any).user?.campaignId !== "dev-bypass",
    };
  }
}
