import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomService {
	constructor(private readonly prisma: PrismaService){}

	async createRoom(memberId1: string, memberId2: string){
		if(!memberId1 || !memberId2) throw new NotFoundException("chat members id's not found")
		const chat = await this.prisma.chat.create({
			data: {}
		}).catch(err => err)
		await this.prisma.chatMember.createMany({
			data: [
				{ 
					userId: memberId1,
					chatId: chat.id
				},
				{ 
					userId: memberId2,
					chatId: chat.id
				}
			]
		})
	}

	async findRoom(roomId: string){
		return await this.prisma.chat.findFirst({
			where: { id: roomId },
		})
	}

	async getRooms(userId: string){
		if(!userId) throw new NotFoundException('user not found')
			return await this.prisma.chat.findMany({
				where: {
					members: {
						some: {
							userId
						}
					}
				}
			})
	}
	
	async getRoomByUserId(userId: string){
		if(!userId) throw new NotFoundException('user not found')
		const room = await this.prisma.chat.findFirst({
			where: {
				members: {
					some: {
						userId
					}
				}
			}
		})
		if(!room) throw new NotFoundException('you don`t have chat with this user')
			
		return room
	}

	async getRoomMembers(roomId: string){
		if(!roomId) throw new NotFoundException('room not found')
		return await this.prisma.chatMember.findMany({
			where: {
				chatId: roomId
			},
			include: {
				user: {
					include: {
						profile: true
					}
				}
			}
		})
	}

	async getRoomsData(userId: string){
		return await this.prisma.chat.findMany({
			where: {
				members: {
					some: {
						userId
					}
				}
			},
			include: {
				members: {
					include: {
						user: {
							include: {
								profile: true
							}
						}
					}
				}
			}
		})
	}

}
