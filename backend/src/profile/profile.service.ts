import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDto } from './dto';
import { Profile } from '@prisma/client';
import { JwtPayload } from 'src/auth/interfaces';

@Injectable()
export class ProfileService {
	constructor(
		private readonly prisma: PrismaService,
	) {}


	async createProfile(dto: ProfileDto): Promise<Profile>{
		if(!dto) throw new ForbiddenException('Invalid DTO');
		const findProfile = await this.prisma.profile.findFirst({
			where: {
				userId: dto.user.id
			}
		});

		if(findProfile) throw new ForbiddenException('Profile already exists');

		return await this.prisma.profile.create({
			data: {
				displayName: dto.displayName,
				bio: dto.bio,
				avatar: dto.avatar,
				user: {
					connect: {
						id: dto.user.id
					}
				}
			}
		})
	}

	async findProfile(userId: string): Promise<Profile>{
		const profile = await this.prisma.profile.findFirst({
			where: {
				user: {
					id: userId,
				},
			}
		})

		if(!profile) throw new NotFoundException("profile not found");

		return profile
	}

	async getCurrentProfile(user: JwtPayload){
		return await this.prisma.profile.findFirst({
			where: {
				user: {
					id: user.id,
				},
			}
		})
	}

}
