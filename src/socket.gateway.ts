import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ENV_VARS } from "./app.const";

@WebSocketGateway({
  allowEIO3: true,
  path: "/socket.chat",
  cors: {
    methods: ["GET", "POST"],
    credentials: true,
    origin: (process.env.CORS_SOCKET_CHAT ?? "").split(",").filter(Boolean),
  },
  transports: ["polling", "websocket"],
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private parseCookieHeader(header?: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!header) return out;
    header.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx > -1) {
        out[decodeURIComponent(pair.slice(0, idx).trim())] = decodeURIComponent(
          pair.slice(idx + 1).trim(),
        );
      }
    });
    return out;
  }

  afterInit(server: Server) {
    this.logger.log("Initialized");
    this.logger.log(
      `Socket chat server path: ${JSON.stringify(server.path())}`,
    );

    const secret =
      this.config.get<string>(ENV_VARS.JWT_CLICK_TO_CHAT_SECRET) ??
      "dev_only_change_me_click_to_chat";
    const disabled =
      this.config.get<string>(ENV_VARS.CLICK_TO_CHAT_AUTH_DISABLED) === "true";

    server.use((socket: Socket, next) => {
      try {
        const cookies = this.parseCookieHeader(socket.request.headers.cookie);
        const token = cookies["auth_token_click_to_chat"];

        if (!token) {
          if (disabled) return next();
          return next(new Error("Unauthorized: missing token"));
        }

        const payload = this.jwtService.verify(token, { secret });
        socket.data.user = payload;
        return next();
      } catch (e) {
        this.logger.warn(`Socket auth failed: ${String(e)}`);
        return next(new Error("Unauthorized: invalid or expired token"));
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private isAuthorized(claims: any, data: any): boolean {
    if (!claims?.campaignId || !claims?.senderFrom) return true;
    return (
      data?.campaignId === claims.campaignId &&
      data?.senderFrom === claims.senderFrom
    );
  }

  @SubscribeMessage("socketClientStart")
  async socketClientStart(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const disabled =
        this.config.get<string>(ENV_VARS.CLICK_TO_CHAT_AUTH_DISABLED) ===
        "true";
      if (!disabled && !this.isAuthorized(client.data.user, data)) {
        this.logger.warn(
          "socketClientStart forbidden: data does not match token claims",
        );
        return;
      }

      const senderId = `${data?.campaignId}_${data?.senderFrom}`;
      await client.join(senderId);
      client.emit("cookied user", client.data.user);
    } catch (error) {
      this.logger.error(`socketClientStart error: ${String(error)}`);
    }
  }

  @SubscribeMessage("addNewChatSession")
  async addNewChatSession(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const disabled =
        this.config.get<string>(ENV_VARS.CLICK_TO_CHAT_AUTH_DISABLED) ===
        "true";
      if (!disabled && !this.isAuthorized(client.data.user, data)) {
        this.logger.warn(
          "addNewChatSession forbidden: data does not match token claims",
        );
        return;
      }

      const senderId = `${data?.campaignId}_${data?.senderFrom}`;
      await client.join(senderId);
      client.emit("cookied user", client.data.user);
      this.logger.log(`addNewChatSession: joined room ${senderId}`);
    } catch (error) {
      this.logger.error(`addNewChatSession error: ${String(error)}`);
    }
  }

  @SubscribeMessage("addNewChatMessage")
  async addNewChatMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const disabled =
        this.config.get<string>(ENV_VARS.CLICK_TO_CHAT_AUTH_DISABLED) ===
        "true";
      if (!disabled && !this.isAuthorized(client.data.user, data)) {
        this.logger.warn(
          "addNewChatMessage forbidden: data does not match token claims",
        );
        return;
      }

      this.logger.log(
        `addNewChatMessage from ${data?.campaignId}_${data?.senderFrom}`,
      );
    } catch (error) {
      this.logger.error(`addNewChatMessage error: ${String(error)}`);
    }
  }

  @SubscribeMessage("clientEndSession")
  async clientEndSession(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const disabled =
        this.config.get<string>(ENV_VARS.CLICK_TO_CHAT_AUTH_DISABLED) ===
        "true";
      const claims = client.data.user;
      if (
        !disabled &&
        claims?.campaignId &&
        data?.campaignId !== claims.campaignId
      ) {
        this.logger.warn(
          "clientEndSession forbidden: campaignId does not match token claims",
        );
        return;
      }

      this.logger.log(`clientEndSession for campaignId: ${data?.campaignId}`);
    } catch (error) {
      this.logger.error(`clientEndSession error: ${String(error)}`);
    }
  }
}
