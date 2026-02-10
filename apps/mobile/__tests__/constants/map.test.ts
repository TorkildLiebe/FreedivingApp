import { createMapStyle, DEFAULT_CENTER, DEFAULT_ZOOM, TILE_URLS } from '@/constants/map';

describe('map constants', () => {
  it('has correct default center (Oslo)', () => {
    expect(DEFAULT_CENTER.lat).toBeCloseTo(59.9139, 4);
    expect(DEFAULT_CENTER.lng).toBeCloseTo(10.7522, 4);
  });

  it('has a reasonable default zoom level', () => {
    expect(DEFAULT_ZOOM).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_ZOOM).toBeLessThanOrEqual(15);
  });

  it('has tile URLs for topo and nautical', () => {
    expect(TILE_URLS.topo).toContain('kartverket.no');
    expect(TILE_URLS.topo).toContain('{z}');
    expect(TILE_URLS.nautical).toContain('kartverket.no');
    expect(TILE_URLS.nautical).toContain('sjokartraster');
  });

  describe('createMapStyle', () => {
    it('returns valid MapLibre style JSON for topo', () => {
      const style = createMapStyle(TILE_URLS.topo);
      expect(style.version).toBe(8);
      expect(style.sources).toHaveProperty('kartverket');
      expect(style.layers).toHaveLength(1);
      expect(style.layers[0]).toMatchObject({
        id: 'kartverket-tiles',
        type: 'raster',
        source: 'kartverket',
      });
    });

    it('returns valid MapLibre style JSON for nautical', () => {
      const style = createMapStyle(TILE_URLS.nautical);
      const source = style.sources.kartverket as { tiles: string[] };
      expect(source.tiles[0]).toContain('sjokartraster');
    });

    it('includes the tile URL in the source', () => {
      const url = 'https://example.com/tiles/{z}/{y}/{x}.png';
      const style = createMapStyle(url);
      const source = style.sources.kartverket as { tiles: string[] };
      expect(source.tiles).toEqual([url]);
    });
  });
});
