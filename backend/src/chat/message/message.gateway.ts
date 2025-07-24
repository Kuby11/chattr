import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { MessageService } from './message.service';
import { serverType } from '../types';
import { CreateMessageDto } from './dto';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards';
import { Socket } from 'socket.io'
import { wsAuthMiddleware } from 'src/auth/middlewares';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ 
  namespace: "message",
  cors: {
    origin: "*",
  },
})
export class MessageGateway {
  @WebSocketServer()
  server: serverType;
 
  afterInit(client: Socket){
    client.use(wsAuthMiddleware() as any)
    Logger.log('ws afterInit')
  }
    
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
