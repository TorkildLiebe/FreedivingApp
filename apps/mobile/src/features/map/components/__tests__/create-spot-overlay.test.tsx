import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import '@/src/__tests__/mocks/expo-vector-icons.mock';
import { CreateSpotOverlay } from '@/src/features/map/components/create-spot-overlay';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ScrollView, View } = require('react-native');

  // eslint-disable-next-line react/display-name
  const BottomSheet = React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));

    return React.createElement(
      View,
      { testID: 'bottom-sheet', ...props },
      children,
    );
  });

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetScrollView: ({ children, ...props }: any) =>
      React.createElement(
        ScrollView,
        { testID: 'create-spot-form-scroll', ...props },
        children,
      ),
  };
});

describe('CreateSpotOverlay', () => {
  const baseProps = {
    visible: true,
    step: 'placing' as const,
    pinCoordinate: { lat: 59.9, lng: 10.7 },
    title: '',
    description: '',
    accessInfo: '',
    photos: [],
    parkingLocations: [],
    parkingLabel: '',
    isSubmitting: false,
    isPickingPhotos: false,
    error: null,
    onCancel: jest.fn(),
    onConfirmPin: jest.fn(),
    onSubmit: jest.fn(),
    onPickPhotos: jest.fn(),
    onRemovePhoto: jest.fn(),
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    onAccessInfoChange: jest.fn(),
    onFormSheetIndexChange: jest.fn(),
    onStartParkingPlacement: jest.fn(),
    onCancelParkingPlacement: jest.fn(),
    onParkingLabelChange: jest.fn(),
    onConfirmParkingPlacement: jest.fn(),
    onRemoveParkingLocation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placement step and confirms pin', () => {
    const { getByTestId, getByText } = render(<CreateSpotOverlay {...baseProps} />);

    expect(getByTestId('create-spot-placement-step')).toBeTruthy();
    expect(getByText('Pan & zoom to position your spot')).toBeTruthy();
    fireEvent.press(getByTestId('create-spot-confirm-pin-button'));
    expect(baseProps.onConfirmPin).toHaveBeenCalledTimes(1);
  });

  it('disables submit button while title is empty in form step', () => {
    const { getByTestId } = render(
      <CreateSpotOverlay {...baseProps} step="form" />,
    );

    expect(getByTestId('create-spot-submit-button')).toBeDisabled();
  });

  it('enables submit button when title is filled and triggers submit', () => {
    const { getByTestId } = render(
      <CreateSpotOverlay {...baseProps} step="form" title="New Spot" />,
    );

    const submitButton = getByTestId('create-spot-submit-button');
    expect(submitButton).toBeEnabled();
    fireEvent.press(submitButton);
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('uses drag sheet configuration for the form step', () => {
    const { getByTestId, queryByTestId } = render(
      <CreateSpotOverlay {...baseProps} step="form" title="New Spot" />,
    );

    const formSheet = getByTestId('bottom-sheet');
    expect(formSheet.props.snapPoints).toEqual(['25%', '55%', '90%']);
    expect(formSheet.props.enablePanDownToClose).toBe(false);
    expect(queryByTestId('create-spot-minimize-button')).toBeNull();
  });

  it('emits form sheet index changes', () => {
    const { getByTestId } = render(
      <CreateSpotOverlay {...baseProps} step="form" title="New Spot" />,
    );

    act(() => {
      getByTestId('bottom-sheet').props.onChange(0);
    });

    expect(baseProps.onFormSheetIndexChange).toHaveBeenCalledWith(0);
  });

  it('uses cancel action as form secondary action', () => {
    const { getByTestId } = render(
      <CreateSpotOverlay {...baseProps} step="form" title="New Spot" />,
    );

    fireEvent.press(getByTestId('create-spot-cancel-form-button'));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows placement error text when provided', () => {
    const { getByTestId, getByText } = render(
      <CreateSpotOverlay
        {...baseProps}
        error="A dive spot already exists within 1000m of this location."
      />,
    );

    expect(getByTestId('create-spot-error-text')).toBeTruthy();
    expect(
      getByText('A dive spot already exists within 1000m of this location.'),
    ).toBeTruthy();
  });

  it('renders parking step and confirms parking placement', () => {
    const { getByTestId, getByText } = render(
      <CreateSpotOverlay {...baseProps} step="parking" />, 
    );

    expect(getByTestId('create-spot-parking-step')).toBeTruthy();
    expect(getByText('Pan & zoom to position parking')).toBeTruthy();
    fireEvent.press(getByTestId('create-spot-confirm-parking-button'));
    expect(baseProps.onConfirmParkingPlacement).toHaveBeenCalledTimes(1);
  });
});
