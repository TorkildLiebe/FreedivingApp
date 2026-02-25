import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import '@/src/__tests__/mocks/expo-vector-icons.mock';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// eslint-disable-next-line import/first
import { AddDiveFormSheet } from '@/src/features/map/components/add-dive-form-sheet';

describe('AddDiveFormSheet', () => {
  it('renders step 1 defaults', () => {
    const { getByText } = render(
      <AddDiveFormSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        error={null}
        onDismiss={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    expect(getByText('Log a Dive')).toBeTruthy();
    expect(getByText('8 m')).toBeTruthy();
  });

  it('moves to step 2 and submits normalized payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <AddDiveFormSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        error={null}
        onDismiss={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(getByTestId('add-dive-next-button'));
    fireEvent.changeText(getByTestId('add-dive-notes-input'), '  calm and clear  ');

    await act(async () => {
      fireEvent.press(getByTestId('add-dive-submit-button'));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        visibilityMeters: 8,
        currentStrength: 1,
        notes: 'calm and clear',
      }),
    );
  });

  it('shows validation error for future date', () => {
    const { getByTestId, getByText } = render(
      <AddDiveFormSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        error={null}
        onDismiss={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.changeText(getByTestId('add-dive-date-input'), '2999-01-01');
    fireEvent.press(getByTestId('add-dive-next-button'));

    expect(getByText('Dive date cannot be in the future.')).toBeTruthy();
  });

  it('prefills edit mode values and submits save payload', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByText, getByTestId } = render(
      <AddDiveFormSheet
        visible
        mode="edit"
        initialValues={{
          visibilityMeters: 12,
          currentStrength: 4,
          divedAt: '2026-02-24T10:00:00.000Z',
          notes: 'Original notes',
          photoUrls: ['https://example.com/photo-1.jpg'],
        }}
        spotName="Langoyene"
        isSubmitting={false}
        error={null}
        onDismiss={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(getByText('Edit Dive')).toBeTruthy();
    expect(getByText('12 m')).toBeTruthy();
    fireEvent.press(getByTestId('add-dive-next-button'));

    await act(async () => {
      fireEvent.press(getByTestId('add-dive-submit-button'));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        visibilityMeters: 12,
        currentStrength: 4,
        existingPhotoUrls: ['https://example.com/photo-1.jpg'],
      }),
    );
  });
});
