import { Module } from '@nestjs/common';
import { MessageModule } from './message/message.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
	providers: [MessageModule, PrismaService],
	exports: [MessageModule]
})
export class ChatModule {}
