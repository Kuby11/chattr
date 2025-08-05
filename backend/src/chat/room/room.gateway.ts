import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { RoomService } from './room.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards';
import { serverType } from '../types';
import { Socket } from 'socket.io';
import { WsUser } from 'src/libs/decorators/ws-user.decorator';
import { User } from '@prisma';
import { profile } from 'console';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({
  namespace: 'room',
  cors: {
    origin: process.env['ORIGIN']
  }
})
export class RoomGateway {
  @WebSocketServer()
  server: serverType;

  constructor(private readonly roomService: RoomService) {}
 
  @SubscribeMessage("joinRoom")
  async joinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket
  ){
    const room = await this.roomService.findRoom(roomId)
    this.server.emit('joinRoom', room)
    socket.join(roomId)
    console.log(socket.id)
    console.log(socket.rooms)
  }

  @SubscribeMessage("leaveRoom")
  async leaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket
  ){
    socket.leave(roomId)
    // console.log('leaved chat:' + roomId)
  }

  @SubscribeMessage("getRooms")
  async loadRooms(
    @WsUser() user: User
  ){
    const roomsData = await this.roomService.getRoomsData(user.id)
    return roomsData
  }
}
