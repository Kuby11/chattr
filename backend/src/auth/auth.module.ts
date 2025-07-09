import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { GUARDS } from './guards';
import { options } from './configs';
import { STRATEGIES } from './strategies';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    UserService,
    JwtService,
    UserModule,
    ...STRATEGIES,
    ...GUARDS,
  ],
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync(options()),
  ],
})
export class AuthModule {}
