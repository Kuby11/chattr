import { Body,ClassSerializerInterceptor,Controller, Delete, Get, HttpStatus, Param, Post, Req, Res, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { User } from '@prisma/client';
import { Response } from 'express';
import { Cookie, CurrentUser, Public, UserAgent } from 'src/libs/decorators';
import { UserResponse } from 'src/user/responses';
import { AuthGuard } from '@nestjs/passport';

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Public()
  @Post("login")
  async login(
    @Body() dto: LoginDto, 
    @Res() response: Response,
    @UserAgent() agent: string,
  ) {     
    const token = await this.authService.validateUser(dto, agent)
     .catch((err) => { throw err });

    this.authService.setRefreshTokenCookies(response, token)
      .catch((err) => { throw err });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<User> {
    const user = await this.authService.register(dto);
    return new UserResponse(user)
  }

  @Post('refresh-token')
  async refresh(
    @Cookie('REFRESH_TOKEN') refresh_token: string,
    @Res() response: Response,
    @UserAgent() agent: string
  ){
    if(!refresh_token) throw new UnauthorizedException("no refresh token provided"); 
    
    const tokens = await this.authService.refreshTokens(refresh_token, agent)

    if(!tokens) throw new UnauthorizedException("can`t refresh token");

    this.authService.setRefreshTokenCookies(response, tokens)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Cookie('REFRESH_TOKEN') refresh_token: string, 
    @Res() response: Response
  ){    
    if(!refresh_token) { 
      response.sendStatus(HttpStatus.OK) 
      return;
    };
    
    await this.authService.deleteRefreshToken(refresh_token);
    response.cookie("REFRESH_TOKEN", "", {
      expires: new Date(),
      httpOnly: true,
      secure: true
    });
    response.send({ success: true, message: "logged out" })
  }
}
