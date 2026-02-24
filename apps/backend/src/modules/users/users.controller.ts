import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../../common/auth';
import type { AuthenticatedUser } from '../../common/auth';
import { UsersService } from './users.service';
import { GetMeResponseDto } from './dto/get-me-response.dto';
import { FavoriteSpotsResponseDto } from './dto/favorite-spots-response.dto';

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
      favoriteSpotIds: dbUser.favoriteSpotIds,
    };
  }

  @Post('me/favorites/:spotId')
  @UseGuards(AuthGuard)
  async addFavoriteSpot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spotId', new ParseUUIDPipe()) spotId: string,
  ): Promise<FavoriteSpotsResponseDto> {
    const favoriteSpotIds = await this.usersService.addFavoriteSpot(
      user.userId,
      spotId,
    );
    return { favoriteSpotIds };
  }

  @Delete('me/favorites/:spotId')
  @UseGuards(AuthGuard)
  async removeFavoriteSpot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spotId', new ParseUUIDPipe()) spotId: string,
  ): Promise<FavoriteSpotsResponseDto> {
    const favoriteSpotIds = await this.usersService.removeFavoriteSpot(
      user.userId,
      spotId,
    );
    return { favoriteSpotIds };
  }
}
