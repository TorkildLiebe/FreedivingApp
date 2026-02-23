export class GetMeResponseDto {
  id!: string;
  email!: string | null;
  alias!: string | null;
  bio!: string | null;
  avatarUrl!: string | null;
  role!: string;
  preferredLanguage!: string;
}
