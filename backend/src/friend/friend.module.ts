import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { RoomService } from 'src/chat/room/room.service';

@Module({
  controllers: [FriendController],
  providers: [FriendService, PrismaService, RoomService],
})
export class FriendModule {}
