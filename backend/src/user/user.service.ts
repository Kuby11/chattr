import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { JwtPayload } from 'src/auth/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
