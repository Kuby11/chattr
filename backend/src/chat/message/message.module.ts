import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomService } from '../room/room.service';

@Module({
  providers: [MessageGateway,MessageService,PrismaService, RoomService],
})
export class MessageModule {}
