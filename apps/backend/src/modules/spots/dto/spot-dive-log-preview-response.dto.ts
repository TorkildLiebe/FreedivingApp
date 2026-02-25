export class SpotDiveLogPreviewResponseDto {
  id!: string;
  spotId!: string;
  authorId!: string;
  authorAlias!: string | null;
  authorAvatarUrl!: string | null;
  visibilityMeters!: number;
  currentStrength!: number;
  notes!: string | null;
  photoUrls!: string[];
  notesPreview!: string | null;
  divedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
