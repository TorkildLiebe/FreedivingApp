import React from 'react';
import { render } from '@testing-library/react-native';
import type { SpotSummary } from '@/src/features/map/types';

const mockComponents: Record<string, any> = {};

jest.mock('@maplibre/maplibre-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  const create = (name: string) => {
    const comp = mockReact.forwardRef((props: any, ref: any) =>
      mockReact.createElement(
        'View',
        { testID: name, ref, ...props },
        props.children,
      ),
    );
    mockComponents[name] = comp;
    return comp;
  };
  return {
    __esModule: true,
    default: {
      MapView: create('MapView'),
      Camera: create('Camera'),
      PointAnnotation: create('PointAnnotation'),
      ShapeSource: create('ShapeSource'),
      CircleLayer: create('CircleLayer'),
      SymbolLayer: create('SymbolLayer'),
      RasterSource: create('RasterSource'),
      RasterLayer: create('RasterLayer'),
    },
    MapView: create('MapView'),
    Camera: create('Camera'),
    PointAnnotation: create('PointAnnotation'),
    ShapeSource: create('ShapeSource'),
    CircleLayer: create('CircleLayer'),
    SymbolLayer: create('SymbolLayer'),
    RasterSource: create('RasterSource'),
    RasterLayer: create('RasterLayer'),
  };
});

// eslint-disable-next-line import/first
import { MapView } from '../map-view';

const defaultProps = {
  tileUrl: 'https://example.com/tiles/{z}/{y}/{x}.png',
  center: { lat: 59.9, lng: 10.7 },
  zoom: 10,
  location: null,
};

const spots: SpotSummary[] = [
  { id: '1', title: 'Spot A', centerLat: 59.0, centerLon: 10.0 },
  { id: '2', title: 'Spot B', centerLat: 60.0, centerLon: 11.0 },
];

describe('MapView.native', () => {
  it('renders ShapeSource with cluster enabled', () => {
    const { getByTestId } = render(
      <MapView {...defaultProps} spots={spots} />,
    );
    const source = getByTestId('ShapeSource');
    expect(source.props.cluster).toBe(true);
    expect(source.props.clusterRadius).toBe(50);
    expect(source.props.clusterMaxZoomLevel).toBe(14);
  });

  it('passes correct GeoJSON shape to ShapeSource', () => {
    const { getByTestId } = render(
      <MapView {...defaultProps} spots={spots} />,
    );
    const source = getByTestId('ShapeSource');
    const shape = source.props.shape;
    expect(shape.type).toBe('FeatureCollection');
    expect(shape.features).toHaveLength(2);
    expect(shape.features[0].geometry.coordinates).toEqual([10.0, 59.0]);
  });

  it('renders both CircleLayers (clusters + unclustered)', () => {
    const { getAllByTestId } = render(
      <MapView {...defaultProps} spots={spots} />,
    );
    const layers = getAllByTestId('CircleLayer');
    expect(layers).toHaveLength(2);
    expect(layers[0].props.id).toBe('spot-clusters');
    expect(layers[1].props.id).toBe('spot-unclustered');
  });

  it('renders SymbolLayer for cluster count labels', () => {
    const { getByTestId } = render(
      <MapView {...defaultProps} spots={spots} />,
    );
    const labelLayer = getByTestId('SymbolLayer');
    expect(labelLayer.props.id).toBe('spot-cluster-count');
    expect(labelLayer.props.style.textField).toEqual([
      'get',
      'point_count_abbreviated',
    ]);
  });

  it('highlights selected marker with larger radius style', () => {
    const { getAllByTestId } = render(
      <MapView {...defaultProps} spots={spots} selectedSpotId="2" />,
    );
    const layers = getAllByTestId('CircleLayer');
    const unclustered = layers.find((layer) => layer.props.id === 'spot-unclustered');
    expect(unclustered).toBeDefined();
    expect(unclustered?.props.style.circleRadius).toEqual([
      'case',
      ['==', ['get', 'id'], '2'],
      11,
      7,
    ]);
  });

  it('renders user location PointAnnotation when location provided', () => {
    const { getByTestId } = render(
      <MapView
        {...defaultProps}
        location={{ lat: 59.5, lng: 10.5 }}
        spots={spots}
      />,
    );
    const annotation = getByTestId('PointAnnotation');
    expect(annotation.props.id).toBe('user-location');
    expect(annotation.props.coordinate).toEqual([10.5, 59.5]);
  });

  it('renders empty GeoJSON when no spots provided', () => {
    const { getByTestId } = render(<MapView {...defaultProps} />);
    const source = getByTestId('ShapeSource');
    expect(source.props.shape.features).toHaveLength(0);
  });

  it('renders RasterSource with correct tile URL template', () => {
    const { getByTestId } = render(<MapView {...defaultProps} />);
    const rasterSource = getByTestId('RasterSource');
    expect(rasterSource.props.id).toBe('kartverket-source');
    expect(rasterSource.props.tileUrlTemplates).toEqual([
      'https://example.com/tiles/{z}/{y}/{x}.png',
    ]);
    expect(rasterSource.props.tileSize).toBe(256);
  });

  it('renders RasterLayer inside RasterSource', () => {
    const { getByTestId } = render(<MapView {...defaultProps} />);
    const rasterLayer = getByTestId('RasterLayer');
    expect(rasterLayer.props.id).toBe('kartverket-layer');
  });
});
