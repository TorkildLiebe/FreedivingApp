export class GetMeResponseDto {
  id!: string;
  email!: string | null;
  displayName!: string | null;
  avatarUrl!: string | null;
  role!: string;
  preferredLanguage!: string;
}
