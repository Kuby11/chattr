import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from '@prisma';
import { CurrentUser } from 'src/libs/decorators';
import { JwtPayload } from 'src/auth/interfaces';
import { ProfileDto } from './dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  @Get('all')
  async getAllProfiles(): Promise<Profile[]> {
    return await this.profileService.findAllProfiles();
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload){
    return this.profileService.getCurrentProfile(user)
  }

  @Patch('update/:id')
  async updateProfile(
    @Param("id") id: string,
    @Body() payload: UpdateProfileDto
  ) {
    return this.profileService.updateProfile(id, payload)
  }
}
