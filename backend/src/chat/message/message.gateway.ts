import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { MessageService } from './message.service';
import { serverType } from '../types';
import { CreateMessageDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards';
import { WsUser } from 'src/libs/decorators/ws-user.decorator';
import { User } from '@prisma';

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
 
  constructor(
    private readonly messageService: MessageService,
  ) {}
    
  @SubscribeMessage("sendMessage")
  async sendMessage(
    @MessageBody() dto: CreateMessageDto,
    @WsUser() user: User,
  ) {
    const senderData = await this.messageService.verifySender(user.id, dto.roomId)
    const message = await this.messageService.send(dto, user.id);
    const messageData = { message, senderData }
    
    console.log(message.chatId)

    this.server.emit("newMessage", messageData);
    
    return messageData
  }

  @SubscribeMessage("findAllMessages")
  async findAll(
    @MessageBody() roomId: string
  ) {
    const message = await this.messageService.findAll(roomId)
    const messageData = message.map((message) => {
      return {
        message: message,
        senderData: {
          senderInfo: message.sender,
          senderProfile: message.sender.profile
        }
      }
    })
    return messageData
  }

  @SubscribeMessage("typing")
  handleTyping() {}
}
