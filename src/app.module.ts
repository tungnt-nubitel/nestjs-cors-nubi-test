import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SocketGateway } from "./socket.gateway";
import { EventsGateway } from "./events.gateway";
import { EventsModule } from "./events.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
    }),

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, SocketGateway, EventsGateway],
})
export class AppModule {}
