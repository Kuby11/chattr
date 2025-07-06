import { ConflictException, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/libs/decorators';
import { FriendService } from './friend.service';
import { User } from '@prisma';
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
        if (err.code === "P2002")
          throw new ConflictException("you already are friends with this user");
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

  @UseGuards(AuthGuard("jwt"))
  @Post("cancel-friend-request/:requestId")
  async cancelFriendRequest(
    @CurrentUser() sender: User,
    @Param("requestId") requestId: string
  ) {
    return this.friendService
     .cancelFriendRequest(sender.id, requestId)
     .catch((err) => {
        throw err;
      });
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("test/:receiverId")
  async test(
    @CurrentUser() sender: User,
    @Param("receiverId") receiverId: string
  ) {
    return this.friendService.test(receiverId, sender.id);
  }
}
