import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';
import { RoomService } from 'src/chat/room/room.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    ProfileService,
    RoomService
  ],
  exports: [UserService,ProfileService],
})
export class UserModule {}
