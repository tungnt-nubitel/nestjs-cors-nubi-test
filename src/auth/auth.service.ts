import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { ENV_VARS } from "src/app.const";

export type BasicPayload = {
  campaignId: string;
  senderFrom: string;
};

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  // existing method unchanged
  async signToken(appId: string): Promise<{ access_token: string }> {
    const payload = { appId };
    const secret = this.config.get<string>("JWT_SECRET");
    const token = await this.jwt.signAsync(payload, { secret });
    return { access_token: token };
  }

  async signClickToChatToken(
    payload: BasicPayload,
  ): Promise<{ access_token: string; expiresIn: number }> {
    const secret =
      this.config.get<string>(ENV_VARS.JWT_CLICK_TO_CHAT_SECRET) ??
      "dev_only_change_me_click_to_chat";

    const expiresInStr = this.config.get<string>(
      "JWT_CLICK_TO_CHAT_EXPIRES_IN_SECOND",
    );
    const expiresIn =
      expiresInStr != null ? Number(expiresInStr) : 7 * 24 * 60 * 60;
    const signOptions: JwtSignOptions = {
      secret,
      expiresIn,
    };
    const token = await this.jwt.signAsync(payload, signOptions);

    return { access_token: token, expiresIn };
  }

  setAuthCookie(
    res: Response,
    token: string,
    opts?: {
      name?: string;
      maxAgeMs?: number;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      httpOnly?: boolean;
      domain?: string;
    },
  ) {
    const isProd = true;
    res.cookie(opts?.name ?? "nubi_click_to_chat_token", token, {
      httpOnly: true,
      secure: opts?.secure ?? isProd,
      sameSite: opts?.sameSite ?? (isProd ? "none" : "lax"),
      path: opts?.path ?? "/",
      maxAge: opts?.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000,
      domain: opts?.domain ?? undefined,
    });
  }

  clearAuthCookie(
    res: import("express").Response,
    opts?: {
      name?: string;
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      domain?: string;
    },
  ) {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie(opts?.name ?? "nubi_click_to_chat_token", {
      path: opts?.path ?? "/",
      sameSite: opts?.sameSite ?? (isProd ? "none" : "lax"),
      secure: opts?.secure ?? isProd,
      domain: opts?.domain,
    });
  }
}
