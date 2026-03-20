// src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "/events",
  cors: {
    origin: ["https://cxuat.nubitel.io", "https://app.nubitel.io"],
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  constructor() {
    console.log("EventsGateway initialized");
  }

  afterInit(server: Server) {
    console.log("Initialized");
  }
  handleConnection(client: Socket) {
    console.log("Client connected:", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
  }

  @SubscribeMessage("ping")
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.emit("pong", { message: "pong" });
  }
}
