import { Module } from '@nestjs/common';
import { MessageModule } from './message/message.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomModule } from './room/room.module';

@Module({
	providers: [MessageModule, PrismaService, RoomModule],
	exports: [MessageModule],
})
export class ChatModule {}
