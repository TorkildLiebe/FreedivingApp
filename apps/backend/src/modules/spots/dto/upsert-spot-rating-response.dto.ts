export class UpsertSpotRatingResponseDto {
  id!: string;
  spotId!: string;
  userId!: string;
  rating!: number;
  averageRating!: number | null;
  ratingCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
