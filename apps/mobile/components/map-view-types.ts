export interface MapViewProps {
  styleJSON: string;
  center: { lat: number; lng: number };
  zoom: number;
  location: { lat: number; lng: number } | null;
}

export interface MapViewHandle {
  flyTo(coords: { lat: number; lng: number }, zoom?: number): void;
}
