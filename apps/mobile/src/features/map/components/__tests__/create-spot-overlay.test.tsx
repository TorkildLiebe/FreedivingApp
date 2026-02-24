import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import '@/src/__tests__/mocks/expo-vector-icons.mock';
import { CreateSpotOverlay } from '@/src/features/map/components/create-spot-overlay';

describe('CreateSpotOverlay', () => {
  const baseProps = {
    visible: true,
    step: 'placing' as const,
    pinCoordinate: { lat: 59.9, lng: 10.7 },
    title: '',
    description: '',
    accessInfo: '',
    photos: [],
    isSubmitting: false,
    isPickingPhotos: false,
    error: null,
    onCancel: jest.fn(),
    onConfirmPin: jest.fn(),
    onBackToPin: jest.fn(),
    onSubmit: jest.fn(),
    onPickPhotos: jest.fn(),
    onRemovePhoto: jest.fn(),
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    onAccessInfoChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placement step and confirms pin', () => {
    const { getByTestId } = render(<CreateSpotOverlay {...baseProps} />);

    expect(getByTestId('create-spot-placement-step')).toBeTruthy();
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
});
