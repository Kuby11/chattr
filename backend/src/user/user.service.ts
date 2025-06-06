import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { JwtPayload } from 'src/auth/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { userDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findOne(emailOrIdOrUsername: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrIdOrUsername },
          { id: emailOrIdOrUsername },
          { username: emailOrIdOrUsername },
        ],
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async createUser(dto: userDto): Promise<User>{
    
    const password = await argon2.hash(dto.password);
    const findUser = await this.prisma.user.findFirst({
      where: {
        OR: [{email: dto.email}, {username: dto.username}]
      },
    });
    
    if (findUser) throw new ConflictException("User with this data already exists");
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: password,
        profile: {
          create: {
            displayName: dto.username,
            bio: undefined,
            avatar: undefined,
          },
        },
      } 
    })

    return user;
  }

  async delete(id: string, user: JwtPayload){    
    
    if(user.id !== id && !user.role.includes('ADMIN')){
      throw new ForbiddenException("You can`t delete this user");
    }

    return await this.prisma.user.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
  }
}
