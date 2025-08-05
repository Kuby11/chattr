import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto';
import { serverType } from '../types';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService
  ){}

  async send(createMessageDto: CreateMessageDto, senderId: string) {
    return await this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        chatId: createMessageDto.roomId,
        senderId: senderId
      },
    });
  }

  async findAll(roomId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId: roomId
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        }
      }
    })
    return messages
  }

  async verifySender(senderId: string, roomId: string){
    await this.prisma.chat.findFirst({
      where: {
        AND: [
          { id: roomId },
          {
            members: {
              some: {
                userId: senderId
              }
            }
          }
        ]
      }
    }).catch(() => {
      throw new WsException('you cant sent message tp this chat!')
    })

    const [senderInfo, senderProfile ] = await this.prisma.$transaction([
      this.prisma.user.findFirst({
        where: {
          id: senderId
        }
      }),

      this.prisma.profile.findFirst({
        where: {
          userId: senderId
        }
      })
    ])
    return { senderInfo, senderProfile }
  }

}
