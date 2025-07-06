import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto';
import { serverType } from '../types';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService
  ){}

  async create(createMessageDto: CreateMessageDto) {
    console.log(createMessageDto.content)
    return await this.prisma.message.create({
      data: {
        content: createMessageDto.content
      },
    });
  }

  async findAll(server: serverType) {
    const messages = await this.prisma.message.findMany()
    console.log(messages)
    return messages;

  }

}
