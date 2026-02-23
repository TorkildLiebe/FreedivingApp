import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../../common/auth';
import type { AuthenticatedUser } from '../../common/auth';
import { UsersService } from './users.service';
import { GetMeResponseDto } from './dto/get-me-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GetMeResponseDto> {
    const dbUser = await this.usersService.findById(user.userId);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
    return {
      id: dbUser.id,
      email: dbUser.email,
      alias: dbUser.alias,
      bio: dbUser.bio,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      preferredLanguage: dbUser.preferredLanguage,
    };
  }
}
