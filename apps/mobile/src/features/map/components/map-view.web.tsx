import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapViewHandle, MapViewProps } from './map-view-types';
import type { SpotSummary } from '@/src/features/map/types';

export type { MapViewHandle };

function createSpotMarkerElement(): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#E8632B',
    border: '2px solid #fff',
    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
    cursor: 'pointer',
  });
  return el;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView(
    { styleJSON, center, zoom, location, spots, onRegionDidChange },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);
    const spotMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
    const onRegionDidChangeRef = useRef(onRegionDidChange);
    onRegionDidChangeRef.current = onRegionDidChange;

    // Initialize map
    useEffect(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: JSON.parse(styleJSON),
        center: [center.lng, center.lat],
        zoom,
      });

      mapRef.current = map;

      map.on('moveend', () => {
        const cb = onRegionDidChangeRef.current;
        if (!cb) return;
        const bounds = map.getBounds();
        cb({
          latMin: bounds.getSouth(),
          latMax: bounds.getNorth(),
          lonMin: bounds.getWest(),
          lonMax: bounds.getEast(),
        });
      });

      // Fire initial bounds after load
      map.on('load', () => {
        const cb = onRegionDidChangeRef.current;
        if (!cb) return;
        const bounds = map.getBounds();
        cb({
          latMin: bounds.getSouth(),
          latMax: bounds.getNorth(),
          lonMin: bounds.getWest(),
          lonMax: bounds.getEast(),
        });
      });

      const currentSpotMarkers = spotMarkersRef.current;
      return () => {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        currentSpotMarkers.forEach((m) => m.remove());
        currentSpotMarkers.clear();
        map.remove();
        mapRef.current = null;
      };
    }, [styleJSON]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update user location marker
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      if (location) {
        if (!userMarkerRef.current) {
          const el = document.createElement('div');
          Object.assign(el.style, {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#007AFF',
            border: '3px solid #fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
          });
          userMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([location.lng, location.lat])
            .addTo(map);
        } else {
          userMarkerRef.current.setLngLat([location.lng, location.lat]);
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }, [location]);

    // Update spot markers
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set((spots ?? []).map((s) => s.id));
      const existingMarkers = spotMarkersRef.current;

      // Remove markers no longer in spots
      existingMarkers.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          existingMarkers.delete(id);
        }
      });

      // Add or update markers
      (spots ?? []).forEach((spot: SpotSummary) => {
        if (existingMarkers.has(spot.id)) return;

        const el = createSpotMarkerElement();
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([spot.centerLon, spot.centerLat])
          .setPopup(
            new maplibregl.Popup({ offset: 12 }).setText(spot.title),
          )
          .addTo(map);

        existingMarkers.set(spot.id, marker);
      });
    }, [spots]);

    useImperativeHandle(ref, () => ({
      flyTo(coords, flyZoom = 14) {
        mapRef.current?.flyTo({
          center: [coords.lng, coords.lat],
          zoom: flyZoom,
          duration: 1000,
        });
      },
    }));

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  },
);
