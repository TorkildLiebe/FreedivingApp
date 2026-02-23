export interface AuthenticatedUser {
  userId: string;
  externalId: string;
  email?: string;
  role: string;
}
