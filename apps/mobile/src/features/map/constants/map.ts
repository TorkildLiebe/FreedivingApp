export const DEFAULT_CENTER = { lat: 59.9139, lng: 10.7522 } as const;
export const DEFAULT_ZOOM = 10;

export const TILE_URLS = {
  topo: 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
  nautical:
    'https://cache.kartverket.no/v1/wmts/1.0.0/sjokartraster/default/webmercator/{z}/{y}/{x}.png',
} as const;

export type MapLayer = keyof typeof TILE_URLS;

interface MapStyleJSON {
  version: 8;
  sources: Record<string, unknown>;
  layers: Record<string, unknown>[];
}

export function createMapStyle(tileUrl: string): MapStyleJSON {
  return {
    version: 8,
    sources: {
      kartverket: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: '&copy; Kartverket',
      },
    },
    layers: [
      {
        id: 'kartverket-tiles',
        type: 'raster',
        source: 'kartverket',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };
}
