import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from '@prisma/client';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService
  ) {}

  
  @Get('find/:id')
  async getProfile(
    @Param("id") id: string,
  ): Promise<Profile> {
    return await this.profileService.findProfile(id);
  }
}
