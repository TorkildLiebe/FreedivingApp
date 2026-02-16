# Expo Setup Guide

Configuration for Expo Router, navigation, and platform handling in DiveFreely.

## Expo Router File Structure

```
apps/mobile/app/
├── _layout.tsx                 # Root layout
├── (auth)/
│   ├── _layout.tsx            # Auth stack layout
│   ├── login.tsx              # /login
│   └── register.tsx           # /register
├── (tabs)/
│   ├── _layout.tsx            # Tab navigator layout
│   ├── index.tsx              # / (Map screen)
│   ├── spots.tsx              # /spots
│   └── profile.tsx            # /profile
├── spots/
│   └── [id].tsx               # /spots/:id
└── +not-found.tsx             # 404 page
```

## Root Layout

```typescript
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/features/auth/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="spots/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
```

## Tab Navigator

```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="spots"
        options={{
          title: 'Spots',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## Navigation Patterns

```typescript
import { router, useRouter, useLocalSearchParams } from 'expo-router';

// Push new route
router.push('/spots/123');

// Navigate with params
router.push({
  pathname: '/spots/[id]',
  params: { id: '123' },
});

// Go back
router.back();

// Replace (no back)
router.replace('/login');

// Access params in route component
function SpotDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpotDetailScreen spotId={id} />;
}
```

## Platform Configuration

### app.json

```json
{
  "expo": {
    "name": "DiveFreely",
    "slug": "divefreely",
    "platforms": ["ios", "android"],
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow DiveFreely to use your location to show nearby dive spots."
        }
      ],
      [
        "@maplibre/maplibre-react-native",
        {
          "useFrameworks": "static"
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.divefreely.app",
      "supportsTablet": false,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "DiveFreely needs your location to show nearby dive spots"
      }
    },
    "android": {
      "package": "com.divefreely.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## Development Build Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Build and run on iOS simulator
pnpm ios

# Build and run on Android emulator
pnpm android

# Build for iOS device
eas build --profile development --platform ios

# Build for Android device
eas build --profile development --platform android
```

## Environment Variables

```typescript
// apps/mobile/src/infrastructure/config.ts
import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000',
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl,
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey,
};
```

```javascript
// app.config.js
export default {
  expo: {
    // ...
    extra: {
      apiUrl: process.env.API_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
```

---

*Reference file for frontend-dev skill*
