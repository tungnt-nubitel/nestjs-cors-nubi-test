import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtOrBypassClickToChatGuard } from "./jwt-or-bypass-click-to-chat.guard";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: "15m",
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtOrBypassClickToChatGuard],
  exports: [AuthService],
})
export class AuthModule {}
