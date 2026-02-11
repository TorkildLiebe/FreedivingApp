import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapViewHandle, MapViewProps } from './map-view-types';

export type { MapViewHandle };

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView({ styleJSON, center, zoom, location }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

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

      return () => {
        markerRef.current?.remove();
        markerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    }, [styleJSON]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update user location marker
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      if (location) {
        if (!markerRef.current) {
          const el = document.createElement('div');
          Object.assign(el.style, {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#007AFF',
            border: '3px solid #fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
          });
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([location.lng, location.lat])
            .addTo(map);
        } else {
          markerRef.current.setLngLat([location.lng, location.lat]);
        }
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }, [location]);

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
