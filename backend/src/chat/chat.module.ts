import { Module } from '@nestjs/common';
import { MessageModule } from './message/message.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomModule } from './room/room.module';
import { UserService } from 'src/user/user.service';
import { RoomService } from './room/room.service';

@Module({
	providers: [PrismaService, RoomService, UserService],
	exports: [MessageModule, RoomModule],
	imports: [RoomModule, MessageModule]
})
export class ChatModule {}
