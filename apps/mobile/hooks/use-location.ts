import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

interface LocationCoords {
  lat: number;
  lng: number;
}

interface UseLocationResult {
  location: LocationCoords | null;
  error: string | null;
  isLoading: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (mounted) {
          setError('Location permission denied');
          setIsLoading(false);
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      if (mounted) {
        setLocation({ lat: current.coords.latitude, lng: current.coords.longitude });
        setIsLoading(false);
      }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (pos) => {
          if (mounted) {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
      );

      if (mounted) {
        subscriptionRef.current = sub;
      } else {
        sub.remove();
      }
    }

    startTracking();

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return { location, error, isLoading };
}
