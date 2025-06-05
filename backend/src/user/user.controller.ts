import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser, Public } from 'src/libs/decorators';
import { JwtPayload } from 'src/auth/interfaces';
import { AuthGuard } from '@nestjs/passport';

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Delete("delete/:id")
  async deleteUser(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload
  ) {    
    await this.userService.delete(id,user);
    return await { message: `User with id: ${id} is deleted successfully` };
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return user;
  }

}
