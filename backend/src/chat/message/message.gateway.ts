import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { MessageService } from './message.service';
import { serverType } from '../types';
import { CreateMessageDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ 
  namespace: "message",
  cors: {
    origin: process.env["ORIGIN"],
  },
})
export class MessageGateway {
  @WebSocketServer()
  server: serverType;
 
  constructor(private readonly messageService: MessageService) {}
    
  @SubscribeMessage("sendMessage")
  async sendMessage(@MessageBody() dto: CreateMessageDto  ) {
    const message = await this.messageService.create(dto);

    this.server.emit("sendMessage", message);

    return message;
  }

  @SubscribeMessage("findAllMessages")
  findAll() {
    return this.messageService.findAll(this.server)
  }

  @SubscribeMessage("typing")
  handleTyping() {}
}
