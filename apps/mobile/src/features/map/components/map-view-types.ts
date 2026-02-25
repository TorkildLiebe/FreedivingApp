import type { SpotSummary, BBox, ParkingLocation } from '@/src/features/map/types';

export interface MapViewProps {
  tileUrl: string;
  center: { lat: number; lng: number };
  zoom: number;
  location: { lat: number; lng: number } | null;
  selectedSpotId?: string | null;
  spots?: SpotSummary[];
  parkingLocations?: ParkingLocation[];
  draftSpotCoordinate?: { lat: number; lng: number } | null;
  draftParkingLocations?: { lat: number; lon: number }[];
  onRegionDidChange?: (bbox: BBox) => void;
  onMapCenterDidChange?: (center: { lat: number; lng: number }) => void;
  onSpotPress?: (spotId: string) => void;
  onParkingPress?: (parking: ParkingLocation) => void;
}

export interface MapViewHandle {
  flyTo(coords: { lat: number; lng: number }, zoom?: number): void;
}
