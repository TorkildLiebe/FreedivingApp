import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_URLS } from '@/src/features/map/constants/map';

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
});
