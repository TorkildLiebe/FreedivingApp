import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import '@/src/__tests__/mocks/expo-vector-icons.mock';

import { RatingSheet } from '@/src/features/map/components/rating-sheet';

describe('RatingSheet', () => {
  it('calls onRate when selecting a star', async () => {
    const onRate = jest.fn().mockResolvedValue(undefined);

    const { getByTestId } = render(
      <RatingSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        onRate={onRate}
        onDismiss={jest.fn()}
      />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('rating-sheet-star-4'));
    });

    await waitFor(() => {
      expect(onRate).toHaveBeenCalledWith(4);
    });
  });

  it('calls onDismiss when pressing Not now', () => {
    const onDismiss = jest.fn();

    const { getByTestId } = render(
      <RatingSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        onRate={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.press(getByTestId('rating-sheet-dismiss-button'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders all required star labels as stars are selected', () => {
    const { getByTestId, getByText } = render(
      <RatingSheet
        visible
        spotName="Langoyene"
        isSubmitting={false}
        onRate={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('rating-sheet-star-1'));
    expect(getByText('Not great')).toBeTruthy();

    fireEvent.press(getByTestId('rating-sheet-star-2'));
    expect(getByText('Below average')).toBeTruthy();

    fireEvent.press(getByTestId('rating-sheet-star-3'));
    expect(getByText('Average')).toBeTruthy();

    fireEvent.press(getByTestId('rating-sheet-star-4'));
    expect(getByText('Really good')).toBeTruthy();

    fireEvent.press(getByTestId('rating-sheet-star-5'));
    expect(getByText('Outstanding')).toBeTruthy();
  });
});
