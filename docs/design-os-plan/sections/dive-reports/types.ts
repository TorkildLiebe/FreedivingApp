export type CurrentLabel = 'calm' | 'light' | 'moderate' | 'strong' | 'very_strong';

export interface DiveLog {
  id: string;
  spotId: string;
  authorAlias: string;
  authorAvatarUrl: string | null;
  /** Visibility in meters (0–30) */
  visibility: number;
  /** Current strength: 1 (calm) to 5 (very strong) */
  current: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  /** Up to 5 photo URLs */
  photos: string[];
  /** ISO 8601 date string */
  createdAt: string;
}

export interface SpotRating {
  id: string;
  spotId: string;
  userId: string;
  /** Quality rating for the location: 1 to 5 stars */
  rating: 1 | 2 | 3 | 4 | 5;
  /** ISO 8601 date string — when the rating was last set or updated */
  updatedAt: string;
}

export interface DiveReportsProps {
  diveLogs: DiveLog[];
  spotRatings: SpotRating[];
  /** ID of the currently authenticated user */
  currentUserId: string;
  onAddDive: (log: Omit<DiveLog, 'id' | 'createdAt'>) => void;
  onUpdateRating: (spotId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  onDeleteLog: (logId: string) => void;
}
