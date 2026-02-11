/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

let loadHandler: (() => void) | null = null;
const mockAddSource = jest.fn();
const mockAddLayer = jest.fn();
const mockSetData = jest.fn();
const mockOn = jest.fn((event: string, layerOrCb: any) => {
  if (event === 'load') loadHandler = layerOrCb;
});
const mockGetSource = jest.fn(() => ({ setData: mockSetData }));
const mockGetBounds = jest.fn(() => ({
  getSouth: () => 59,
  getNorth: () => 61,
  getWest: () => 10,
  getEast: () => 12,
}));
const mockRemove = jest.fn();
const mockGetCanvas = jest.fn(() => ({ style: {} }));
const mockQueryRenderedFeatures = jest.fn(() => []);
const mockEaseTo = jest.fn();
const mockFlyTo = jest.fn();

jest.mock('maplibre-gl', () => ({
  __esModule: true,
  default: {
    Map: jest.fn().mockImplementation(() => ({
      on: mockOn,
      addSource: mockAddSource,
      addLayer: mockAddLayer,
      getSource: mockGetSource,
      getBounds: mockGetBounds,
      getCanvas: mockGetCanvas,
      queryRenderedFeatures: mockQueryRenderedFeatures,
      easeTo: mockEaseTo,
      flyTo: mockFlyTo,
      remove: mockRemove,
    })),
    Marker: jest.fn().mockImplementation(() => ({
      setLngLat: jest.fn().mockReturnThis(),
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    })),
  },
}));

jest.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

// eslint-disable-next-line import/first
import { MapView } from '../map-view.web';

const defaultProps = {
  styleJSON: '{"version":8,"sources":{},"layers":[]}',
  center: { lat: 59.9, lng: 10.7 },
  zoom: 10,
  location: null,
  spots: [
    { id: '1', title: 'Spot A', centerLat: 59.0, centerLon: 10.0 },
    { id: '2', title: 'Spot B', centerLat: 60.0, centerLon: 11.0 },
  ],
};

describe('MapView.web', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    loadHandler = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderAndLoad(props = defaultProps) {
    act(() => {
      root.render(<MapView {...props} />);
    });
    act(() => {
      loadHandler?.();
    });
  }

  it('calls addSource with cluster config on load', () => {
    renderAndLoad();
    expect(mockAddSource).toHaveBeenCalledWith(
      'spots-source',
      expect.objectContaining({
        type: 'geojson',
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      }),
    );
  });

  it('calls addLayer twice (clusters + unclustered)', () => {
    renderAndLoad();
    expect(mockAddLayer).toHaveBeenCalledTimes(2);
    expect(mockAddLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'spot-clusters', type: 'circle' }),
    );
    expect(mockAddLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'spot-unclustered', type: 'circle' }),
    );
  });

  it('passes GeoJSON data with correct features to source', () => {
    renderAndLoad();
    const sourceCall = mockAddSource.mock.calls[0][1];
    expect(sourceCall.data.type).toBe('FeatureCollection');
    expect(sourceCall.data.features).toHaveLength(2);
    expect(sourceCall.data.features[0].geometry.coordinates).toEqual([
      10.0, 59.0,
    ]);
  });

  it('registers click and cursor handlers for layers', () => {
    renderAndLoad();
    const eventCalls = mockOn.mock.calls.map(
      ([event, layer]: [string, any]) =>
        `${event}:${typeof layer === 'string' ? layer : 'fn'}`,
    );
    expect(eventCalls).toContain('click:spot-clusters');
    expect(eventCalls).toContain('mouseenter:spot-clusters');
    expect(eventCalls).toContain('mouseleave:spot-clusters');
    expect(eventCalls).toContain('mouseenter:spot-unclustered');
    expect(eventCalls).toContain('mouseleave:spot-unclustered');
  });

  it('calls setData when spots change', () => {
    renderAndLoad();
    const newSpots = [
      { id: '3', title: 'Spot C', centerLat: 62.0, centerLon: 6.0 },
    ];
    act(() => {
      root.render(<MapView {...defaultProps} spots={newSpots} />);
    });
    expect(mockSetData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection',
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: { id: '3', title: 'Spot C' },
          }),
        ]),
      }),
    );
  });
});
