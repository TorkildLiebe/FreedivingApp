import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { MapViewHandle, MapViewProps } from './map-view-types';

type MapViewModule = {
  MapView: ComponentType<MapViewProps>;
};

const mapViewModule: MapViewModule =
  Platform.OS === 'web'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./map-view.web')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./map-view.native');

export const MapView = mapViewModule.MapView;
export type { MapViewHandle };
