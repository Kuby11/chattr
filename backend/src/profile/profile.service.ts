import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDto } from './dto';
import { Prisma, Profile } from '@prisma';
import { JwtPayload } from 'src/auth/interfaces';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

	async findAllProfiles(): Promise<Profile[]>{
		return await this.prisma.profile.findMany()
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

	async updateProfile(id: string, dto: UpdateProfileDto){
		if(!dto) throw new ForbiddenException('Invalid body');
		
		try{
			return await this.prisma.profile.update({
				where: {
					userId: id
				},
				data: {
					...dto
				}
			})
			
		}catch (err){
			if(
				err instanceof Prisma.PrismaClientKnownRequestError && 
				err.code === 'P2025'
			){
				throw new NotFoundException('profile not found')
			}
			throw err
		} 
			
	}
}
