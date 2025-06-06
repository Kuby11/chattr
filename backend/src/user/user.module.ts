import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    ProfileService
  ],
  exports: [UserService,ProfileService],
})
export class UserModule {}
