import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendRequest } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
		const findFriendRequest = await this.prisma.friendRequest.findFirst({
			where: {
				AND: [{ sender: senderId }, { receiver: receiverId }],
			},
		});

		if (findFriendRequest) throw new ConflictException("Friend request already sent");
		const friendRequest = this.prisma.friendRequest.create({
			data: {
				sender: senderId,
        receiver: receiverId,
        status: "PENDING",
      },
    });
		
    if (!senderId) throw new NotFoundException("sender not found");
    if (!receiverId) throw new NotFoundException("receiver not found");
		if(senderId === receiverId) throw new ForbiddenException("you can't send friend request to yourself")
		

    return friendRequest;
  }

  async acceptFriendRequest(receiverId: string, requestId: string): Promise<FriendRequest> {
		const friendRequest = await this.prisma.friendRequest.update({
			where: {
				id: requestId,
				receiver: receiverId,
			},
			data: {
				status: "ACCEPTED",
			},
		})
		.catch((err) =>{
			if(err.code === "P2025") throw new ForbiddenException("you are not the receiver of this request")
				throw err;
		})
		
		if (!friendRequest) throw new NotFoundException("Friend request not found");
		
		await this.prisma.friend.createMany({
      data: [
        { userId: friendRequest.sender, friendId: receiverId },
				{  userId: receiverId, friendId: friendRequest.sender },
			],
			skipDuplicates: true
    });	

		return friendRequest
  }

  async declineFriendRequest(receiverId: string, requestId: string): Promise<FriendRequest> {
		const friendRequest = await this.prisma.friendRequest.update({
      where: {
        id: requestId,
				receiver: receiverId,	
      },
      data: {
        status: "DECLINED",
      },
    })
		.catch((err) =>{
			if(err.code === "P2025") throw new ForbiddenException("you are not the receiver of this request")
			throw err;
		})

		if (!friendRequest) throw new NotFoundException("Friend request not found");

		return friendRequest
  }
	


}
