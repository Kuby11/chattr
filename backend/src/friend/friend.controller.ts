import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/libs/decorators';
import { FriendService } from './friend.service';
import { User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller("friend")
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("send-friend-request/:receiverId")
  async friendRequest(
    @CurrentUser() sender: User,
    @Param("receiverId") receiverId: string
  ) {
    return this.friendService
      .sendFriendRequest(sender.id, receiverId)
      .catch((err) => {
        throw err;
      });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("accept-friend-request/:requestId")
  async acceptFriendRequest(
    @CurrentUser() receiver: User,
    @Param("requestId") requestId: string
  ) {
    return this.friendService
      .acceptFriendRequest(receiver.id, requestId)
      .catch((err) => {
        throw err;
      });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("decline-friend-request/:requestId")
  async declineFriendRequest(
    @CurrentUser() receiver: User,
    @Param("requestId") requestId: string
  ) {
    return this.friendService
      .declineFriendRequest(receiver.id, requestId)
      .catch((err) => {
        throw err;
      });
  }
}
