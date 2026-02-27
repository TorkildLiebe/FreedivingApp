export class MyDiveReportSummaryDto {
  id!: string;
  spotId!: string;
  spotName!: string;
  date!: Date;
  visibilityMeters!: number;
  currentStrength!: number;
  notesPreview!: string | null;
}

export class MyCreatedSpotSummaryDto {
  id!: string;
  name!: string;
  createdAt!: Date;
  reportCount!: number;
}

export class MyFavoriteSpotSummaryDto {
  id!: string;
  spotId!: string;
  spotName!: string;
  latestVisibilityMeters!: number | null;
  latestReportDate!: Date | null;
}

export class GetMyActivityResponseDto {
  diveReports!: MyDiveReportSummaryDto[];
  createdSpots!: MyCreatedSpotSummaryDto[];
  favorites!: MyFavoriteSpotSummaryDto[];
}
