export class SpotDiveLogPreviewResponseDto {
  id!: string;
  authorAlias!: string | null;
  authorAvatarUrl!: string | null;
  visibilityMeters!: number;
  currentStrength!: number;
  notesPreview!: string | null;
  divedAt!: Date;
}
