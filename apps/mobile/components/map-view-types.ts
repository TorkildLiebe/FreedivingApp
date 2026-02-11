import type { SpotSummary, BBox } from '@/types/spot';

export interface MapViewProps {
  styleJSON: string;
  center: { lat: number; lng: number };
  zoom: number;
  location: { lat: number; lng: number } | null;
  spots?: SpotSummary[];
  onRegionDidChange?: (bbox: BBox) => void;
}

export interface MapViewHandle {
  flyTo(coords: { lat: number; lng: number }, zoom?: number): void;
}
