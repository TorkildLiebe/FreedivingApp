import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { spotsToGeoJSON } from '@/src/features/map/utils/spots-to-geojson';
import { parkingToGeoJSON } from '@/src/features/map/utils/parking-to-geojson';
import type { MapViewHandle, MapViewProps } from './map-view-types';

export type { MapViewHandle };

const SPOTS_SOURCE = 'spots-source';
const CLUSTER_LAYER = 'spot-clusters';
const UNCLUSTERED_LAYER = 'spot-unclustered';
const PARKING_SOURCE = 'parking-source';
const PARKING_LAYER = 'parking-markers';

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  function MapView(
    {
      styleJSON,
      center,
      zoom,
      location,
      spots,
      parkingLocations,
      onRegionDidChange,
      onSpotPress,
      onParkingPress,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);
    const sourceReadyRef = useRef(false);
    const onRegionDidChangeRef = useRef(onRegionDidChange);
    onRegionDidChangeRef.current = onRegionDidChange;
    const onSpotPressRef = useRef(onSpotPress);
    onSpotPressRef.current = onSpotPress;
    const onParkingPressRef = useRef(onParkingPress);
    onParkingPressRef.current = onParkingPress;
    const parkingLocationsRef = useRef(parkingLocations);
    parkingLocationsRef.current = parkingLocations;

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
      sourceReadyRef.current = false;

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

      map.on('load', () => {
        // Add clustering source
        map.addSource(SPOTS_SOURCE, {
          type: 'geojson',
          data: spotsToGeoJSON(spots ?? []),
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14,
        });

        // Cluster circles
        map.addLayer({
          id: CLUSTER_LAYER,
          type: 'circle',
          source: SPOTS_SOURCE,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#E8632B',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              50,
              28,
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // Unclustered individual spots
        map.addLayer({
          id: UNCLUSTERED_LAYER,
          type: 'circle',
          source: SPOTS_SOURCE,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#E8632B',
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        sourceReadyRef.current = true;

        // Click cluster → zoom to expand
        map.on('click', CLUSTER_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [CLUSTER_LAYER],
          });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource(SPOTS_SOURCE) as maplibregl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const coords = (features[0].geometry as GeoJSON.Point).coordinates;
            map.easeTo({
              center: coords as [number, number],
              zoom,
              duration: 500,
            });
          });
        });

        // Click unclustered spot → notify parent
        map.on('click', UNCLUSTERED_LAYER, (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [UNCLUSTERED_LAYER],
          });
          if (!features.length) return;
          const spotId = features[0].properties?.id;
          if (spotId && onSpotPressRef.current) {
            onSpotPressRef.current(spotId);
          }
        });

        // Cursor changes
        map.on('mouseenter', CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', CLUSTER_LAYER, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', UNCLUSTERED_LAYER, () => {
          map.getCanvas().style.cursor = '';
        });

        // Fire initial bounds
        const cb = onRegionDidChangeRef.current;
        if (cb) {
          const bounds = map.getBounds();
          cb({
            latMin: bounds.getSouth(),
            latMax: bounds.getNorth(),
            lonMin: bounds.getWest(),
            lonMax: bounds.getEast(),
          });
        }
      });

      return () => {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        sourceReadyRef.current = false;
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

    // Update spots source data
    useEffect(() => {
      if (!sourceReadyRef.current) return;
      const map = mapRef.current;
      if (!map) return;
      const source = map.getSource(SPOTS_SOURCE) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (source) {
        source.setData(spotsToGeoJSON(spots ?? []));
      }
    }, [spots]);

    // Update parking markers
    useEffect(() => {
      if (!sourceReadyRef.current) return;
      const map = mapRef.current;
      if (!map) return;

      const locations = parkingLocations ?? [];

      if (locations.length > 0) {
        const existingSource = map.getSource(PARKING_SOURCE) as
          | maplibregl.GeoJSONSource
          | undefined;
        if (existingSource) {
          existingSource.setData(parkingToGeoJSON(locations));
        } else {
          map.addSource(PARKING_SOURCE, {
            type: 'geojson',
            data: parkingToGeoJSON(locations),
          });
          map.addLayer({
            id: PARKING_LAYER,
            type: 'circle',
            source: PARKING_SOURCE,
            paint: {
              'circle-color': '#2196F3',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          });
          map.on('click', PARKING_LAYER, (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: [PARKING_LAYER],
            });
            if (!features.length) return;
            const parkingId = features[0].properties?.id;
            const cb = onParkingPressRef.current;
            if (parkingId && cb) {
              const parking = parkingLocationsRef.current?.find(
                (p) => p.id === parkingId,
              );
              if (parking) cb(parking);
            }
          });
          map.on('mouseenter', PARKING_LAYER, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', PARKING_LAYER, () => {
            map.getCanvas().style.cursor = '';
          });
        }
      } else {
        if (map.getLayer(PARKING_LAYER)) map.removeLayer(PARKING_LAYER);
        if (map.getSource(PARKING_SOURCE)) map.removeSource(PARKING_SOURCE);
      }
    }, [parkingLocations]);

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
