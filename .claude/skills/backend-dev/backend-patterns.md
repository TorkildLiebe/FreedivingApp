# Backend Patterns - Code Examples

Detailed code examples for each layer of the vertical slice architecture in DiveFreely.

## Controller Patterns

### Basic CRUD Controller

```typescript
// apps/backend/src/modules/spots/spots.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/src/common/auth/auth.guard';
import { CurrentUser } from '@/src/common/auth/current-user.decorator';
import { JWTPayload } from '@/src/common/auth/types';
import { SpotsService } from './spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { SpotQueryDto } from './dto/spot-query.dto';

@Controller('spots')
@UseGuards(AuthGuard) // All routes require authentication
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  async findAll(@Query() query: SpotQueryDto) {
    return this.spotsService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.spotsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateSpotDto,
    @CurrentUser() user: JWTPayload,
  ) {
    return this.spotsService.create(dto, user.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSpotDto,
    @CurrentUser() user: JWTPayload,
  ) {
    return this.spotsService.update(id, dto, user.sub, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JWTPayload,
  ) {
    await this.spotsService.delete(id, user.sub, user.role);
  }
}
```

### Public + Protected Routes Mix

```typescript
@Controller('spots')
export class SpotsController {
  // Public - no guard
  @Get()
  async findAll(@Query() query: SpotQueryDto) {
    return this.spotsService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.spotsService.findById(id);
  }

  // Protected - requires auth
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() dto: CreateSpotDto,
    @CurrentUser() user: JWTPayload,
  ) {
    return this.spotsService.create(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSpotDto,
    @CurrentUser() user: JWTPayload,
  ) {
    return this.spotsService.update(id, dto, user.sub, user.role);
  }
}
```

## Service Patterns

### Service with Domain Validation

```typescript
// apps/backend/src/modules/spots/spots.service.ts
import { Injectable } from '@nestjs/common';
import { SpotsRepository } from './spots.repository';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import {
  SpotNotFoundError,
  SpotTooCloseError,
  UnauthorizedError,
} from '@/src/common/errors/domain-errors';
import type { DiveSpot } from '@prisma/client';

@Injectable()
export class SpotsService {
  constructor(private readonly repository: SpotsRepository) {}

  async findById(id: string): Promise<DiveSpot> {
    const spot = await this.repository.findById(id);
    if (!spot || spot.isDeleted) {
      throw new SpotNotFoundError(id);
    }
    return spot;
  }

  async create(dto: CreateSpotDto, userId: string): Promise<DiveSpot> {
    // Domain validation: check proximity
    const nearby = await this.repository.findNearbySpots(
      dto.latitude,
      dto.longitude,
      1000, // 1000m minimum distance
    );

    if (nearby.length > 0) {
      const distance = nearby[0].distance;
      throw new SpotTooCloseError(distance);
    }

    return this.repository.create({
      ...dto,
      createdBy: userId,
    });
  }

  async update(
    id: string,
    dto: UpdateSpotDto,
    userId: string,
    userRole: string,
  ): Promise<DiveSpot> {
    const spot = await this.findById(id);

    // Authorization check
    if (spot.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
      throw new UnauthorizedError('You can only update your own spots');
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const spot = await this.findById(id);

    // Authorization check
    if (spot.createdBy !== userId && !['moderator', 'admin'].includes(userRole)) {
      throw new UnauthorizedError('You can only delete your own spots');
    }

    // Soft delete
    await this.repository.softDelete(id);
  }
}
```

### Service with Transactions

```typescript
@Injectable()
export class SpotsService {
  constructor(
    private readonly repository: SpotsRepository,
    private readonly parkingRepository: ParkingRepository,
  ) {}

  async createWithParking(
    dto: CreateSpotDto,
    parkingDtos: CreateParkingDto[],
    userId: string,
  ): Promise<DiveSpot> {
    // Validate parking within 5000m
    for (const parking of parkingDtos) {
      const distance = this.calculateDistance(
        dto.latitude,
        dto.longitude,
        parking.latitude,
        parking.longitude,
      );
      if (distance > 5000) {
        throw new ParkingTooFarError(distance);
      }
    }

    // Use transaction for atomic creation
    return this.repository.createWithParking(dto, parkingDtos, userId);
  }
}
```

## Repository Patterns

### Basic Repository

```typescript
// apps/backend/src/modules/spots/spots.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/src/common/prisma/prisma.service';
import type { DiveSpot, Prisma } from '@prisma/client';

@Injectable()
export class SpotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DiveSpot | null> {
    return this.prisma.diveSpot.findUnique({
      where: { id },
      include: {
        parkingLocations: {
          where: { isDeleted: false },
        },
      },
    });
  }

  async findAll(options: {
    skip?: number;
    take?: number;
    where?: Prisma.DiveSpotWhereInput;
  }): Promise<DiveSpot[]> {
    return this.prisma.diveSpot.findMany({
      where: {
        isDeleted: false,
        ...options.where,
      },
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.DiveSpotCreateInput): Promise<DiveSpot> {
    return this.prisma.diveSpot.create({ data });
  }

  async update(id: string, data: Prisma.DiveSpotUpdateInput): Promise<DiveSpot> {
    return this.prisma.diveSpot.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.diveSpot.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
```

### Repository with PostGIS

```typescript
@Injectable()
export class SpotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNearbySpots(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<Array<{ id: string; title: string; distance: number }>> {
    return this.prisma.$queryRaw`
      SELECT
        id,
        title,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) as distance
      FROM dive_spots
      WHERE is_deleted = false
        AND ST_DWithin(
              location::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
              ${radiusMeters}
            )
      ORDER BY distance ASC;
    `;
  }

  async findInBoundingBox(bbox: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }): Promise<DiveSpot[]> {
    return this.prisma.$queryRaw`
      SELECT *
      FROM dive_spots
      WHERE is_deleted = false
        AND ST_Contains(
              ST_MakeEnvelope(
                ${bbox.minLon}, ${bbox.minLat},
                ${bbox.maxLon}, ${bbox.maxLat},
                4326
              ),
              location
            )
      ORDER BY created_at DESC;
    `;
  }
}
```

### Repository with Transactions

```typescript
@Injectable()
export class SpotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithParking(
    spotData: Prisma.DiveSpotCreateInput,
    parkingData: Prisma.ParkingLocationCreateInput[],
    userId: string,
  ): Promise<DiveSpot> {
    return this.prisma.$transaction(async (tx) => {
      // Create spot
      const spot = await tx.diveSpot.create({
        data: {
          ...spotData,
          createdBy: userId,
        },
      });

      // Create parking locations
      if (parkingData.length > 0) {
        await tx.parkingLocation.createMany({
          data: parkingData.map((p) => ({
            ...p,
            spotId: spot.id,
            createdBy: userId,
          })),
        });
      }

      // Return spot with parking
      return tx.diveSpot.findUnique({
        where: { id: spot.id },
        include: { parkingLocations: true },
      });
    });
  }
}
```

## DTO Patterns

### Create DTO with Validation

```typescript
// apps/backend/src/modules/spots/dto/create-spot.dto.ts
import {
  IsString,
  IsLatitude,
  IsLongitude,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpotDto {
  @IsString()
  @MaxLength(80, { message: 'Title cannot exceed 80 characters' })
  title: string;

  @IsString()
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @IsOptional()
  description?: string;

  @IsLatitude({ message: 'Invalid latitude' })
  latitude: number;

  @IsLongitude({ message: 'Invalid longitude' })
  longitude: number;

  @IsString()
  @MaxLength(1000, { message: 'Access info cannot exceed 1000 characters' })
  @IsOptional()
  accessInfo?: string;

  @IsEnum(['easy', 'moderate', 'difficult', 'expert'])
  @IsOptional()
  difficulty?: string;

  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 parking locations allowed' })
  @ValidateNested({ each: true })
  @Type(() => CreateParkingDto)
  @IsOptional()
  parking?: CreateParkingDto[];
}
```

### Update DTO (Partial)

```typescript
// apps/backend/src/modules/spots/dto/update-spot.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSpotDto } from './create-spot.dto';

export class UpdateSpotDto extends PartialType(
  OmitType(CreateSpotDto, ['latitude', 'longitude'] as const),
) {
  // All fields from CreateSpotDto are optional
  // Lat/lon are omitted - cannot change location after creation
}
```

### Query DTO

```typescript
// apps/backend/src/modules/spots/dto/spot-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SpotQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(50000)
  radiusMeters?: number;
}
```

### Response DTO

```typescript
// apps/backend/src/modules/spots/dto/spot-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

export class ParkingResponseDto {
  @Expose()
  id: string;

  @Expose()
  label: string;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  createdBy: string;
}

export class SpotResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;

  @Expose()
  difficulty?: string;

  @Expose()
  @Type(() => ParkingResponseDto)
  parkingLocations: ParkingResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  createdBy: string;
}
```

## Error Patterns

### Domain Error Definitions

```typescript
// apps/backend/src/common/errors/domain-errors.ts

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 404 errors
export class NotFoundError extends DomainError {}

export class SpotNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Spot with id ${id} not found`);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`User with id ${id} not found`);
  }
}

// 400 errors
export class ValidationError extends DomainError {}

export class SpotTooCloseError extends ValidationError {
  constructor(distance: number) {
    super(`Spot is ${distance}m from existing spot. Minimum distance: 1000m`);
  }
}

export class ParkingTooFarError extends ValidationError {
  constructor(distance: number) {
    super(`Parking is ${distance}m from spot. Maximum distance: 5000m`);
  }
}

export class InvalidBBoxError extends ValidationError {
  constructor(message: string) {
    super(`Invalid bounding box: ${message}`);
  }
}

// 401 errors
export class UnauthorizedError extends DomainError {}

// 403 errors
export class ForbiddenError extends DomainError {}
```

### Exception Filter

```typescript
// apps/backend/src/common/filters/domain-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors/domain-errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof UnauthorizedError) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof ForbiddenError) {
      status = HttpStatus.FORBIDDEN;
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).send({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
```

---

*Reference file for backend-dev skill*
