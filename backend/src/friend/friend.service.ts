import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendRequest } from '@prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<FriendRequest> {
    const findFriendRequest = await this.prisma.friendRequest.findFirst({
      where: {
        AND: [{ senderId: senderId }, { receiverId: receiverId }],
      },
    });

    if (findFriendRequest)
      throw new ConflictException("Friend request already sent");
    const friendRequest = this.prisma.friendRequest.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
        status: "PENDING",
      },
    });

    if (!senderId) throw new NotFoundException("sender not found");
    if (!receiverId) throw new NotFoundException("receiver not found");
    if (senderId === receiverId)
      throw new ForbiddenException("you can't send friend request to yourself");

    return friendRequest;
  }

  async acceptFriendRequest(
    receiverId: string,
    requestId: string
  ): Promise<FriendRequest> {
    const friendRequest = await this.prisma.friendRequest.update({
			where: {
				id: requestId,
				receiverId: receiverId,
			},
			data: {
				status: "ACCEPTED",
			},
		})
		.catch((err) => {
			if (err.code === "P2025")
				throw new ForbiddenException(
					"you are not the receiver of this request"
				);
			throw err;
		});

    if (!friendRequest) throw new NotFoundException("Friend request not found");

    const senderId = friendRequest.senderId

    if (senderId === receiverId) throw new ForbiddenException("you can't send friend request to yourself");

    await this.prisma.friendship.createMany({
			data: [
				{
					userId: senderId,
					friendOfId: receiverId
				},
				{
					userId: receiverId,
					friendOfId: senderId
				},
			]
		})
		.catch((err) => {
			if (err.code === "P2002")
        throw new ConflictException("you already are friends with this user");
			throw err;
		});

    return friendRequest;
  }

  async declineFriendRequest(
    receiverId: string,
    requestId: string
  ): Promise<FriendRequest> {
    const friendRequest = await this.prisma.friendRequest
      .update({
        where: {
          id: requestId,
          receiverId: receiverId,
        },
        data: {
          status: "DECLINED",
        },
      })
      .catch((err) => {
        if (err.code === "P2025")
          throw new ForbiddenException(
            "you are not the receiver of this request"
          );
        throw err;
      });

    if (!friendRequest) throw new NotFoundException("Friend request not found");

    return friendRequest;
  }

	async cancelFriendRequest(
    senderId: string,
    requestId: string
  ) {
		if(!requestId) throw new NotFoundException("request not found")
		if(!senderId) throw new NotFoundException("sender not found")
  	await this.prisma.friendRequest.delete({
      where: {
        id: requestId,
        senderId: senderId,

				status: "PENDING"
      },
    })
		return "friend request canceled";
  }

  async test(receiverId: string, senderId: string) {
		return await this.prisma.friendship.createMany({
			data: [
				{
					userId: senderId,
					friendOfId: receiverId
				},
				{
					userId: receiverId,
					friendOfId: senderId
				},
			]
		})
		
	}
}
