export const DEFAULT_CENTER = { lat: 59.9139, lng: 10.7522 } as const;
export const DEFAULT_ZOOM = 10;

export const TILE_URLS = {
  topo: 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
  nautical:
    'https://cache.kartverket.no/v1/wmts/1.0.0/sjokartraster/default/webmercator/{z}/{y}/{x}.png',
} as const;

export type MapLayer = keyof typeof TILE_URLS;
