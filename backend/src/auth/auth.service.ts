import { ConflictException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Token, User } from '@prisma';
import { Tokens } from './interfaces/token.interface';
import { stringToMs } from 'src/libs/utils';
import { Response } from 'express';
import { IS_DEV_ENV } from 'src/libs/utils/is-dev.util';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly Jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    return await this.userService.createUser(dto);
  }

  async validateUser(dto: LoginDto, agent: string): Promise<Tokens> {		
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        username: dto.username,
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const password = user.password;
    if (!(await argon2.verify(password, dto.password))) throw new UnauthorizedException("Invalid password");
		
    return await this.generateTokens(user, agent);
  }
	
  private async generateTokens(user: User, agent: string) {

    const access_token = 'Bearer ' + await this.Jwt.signAsync(user, {
      secret: this.config.getOrThrow("JWT_SECRET"),
      expiresIn: this.config.getOrThrow("JWT_EXP"),
    });
    if (!user) throw new UnauthorizedException("Invalid payload");
    
    const refresh_token = await this.getRefreshToken(user, agent);
		
    return await {
      access_token,
      refresh_token,
    };
  }

  private async getRefreshToken(user: User, agent: string): Promise<Token> {
    
		const findToken = await this.prisma.token.findFirst({
      where: {
        userId: user.id,
        userAgent: agent,
      },
		});


		const token = findToken?.token ?? '';
		return await this.prisma.token.upsert({
      where: { token },
      update: {
				token: createId(),
				expiresAt: new Date(
					Date.now() + stringToMs(this.config.getOrThrow("REFRESH_TOKEN_EXP"))
				),
			},
      create: {
        token: createId(),
        expiresAt: new Date(
          Date.now() + stringToMs(this.config.getOrThrow("REFRESH_TOKEN_EXP"))
        ),
        userId: user.id,
        userAgent: agent,
      },
    });
  }

	async setRefreshTokenCookies(res: Response, tokens: Tokens){
		if(!tokens) throw new UnauthorizedException("Invalid tokens");
		
		res.cookie("REFRESH_TOKEN", tokens.refresh_token.token, {
      httpOnly: true,
      sameSite: "lax",
      expires: new Date(tokens.refresh_token.expiresAt),
      secure: !IS_DEV_ENV,
			maxAge: stringToMs(this.config.getOrThrow("REFRESH_TOKEN_EXP")),
      path: "/",
    });
		res.status(HttpStatus.CREATED).json({ access_token: tokens.access_token })
	}

	async refreshTokens(refresh_token: string, agent: string): Promise<Tokens>{
		const token = await this.prisma.token.findUnique({
      where: {
        token: refresh_token,
      },
    });
		if(!token) throw new UnauthorizedException("Invalid refresh token");
		
		if(new Date(token.expiresAt) < new Date()){
			await this.prisma.token.delete({ where: { token: refresh_token } });
			throw new TokenExpiredError('token expired', new Date());
		}

		const user = await this.prisma.user.findFirst({ 
			where: { 
				id: token.userId
			}
		})
		if(!user) throw new UnauthorizedException("user not found");

		return this.generateTokens(user, agent)
	}

	async deleteRefreshToken(token: string){
		return await this.prisma.token.delete({
			where: {
				token,
      },
    });
	}	
}
