# React Native + Expo

## What is React Native?

React Native lets you build **native mobile apps** (iOS and Android) using **TypeScript/JavaScript** instead of learning Swift (iOS) and Kotlin (Android) separately.

"Native" means the app looks and feels like a real iPhone/Android app - because it IS one. React Native translates your TypeScript components into actual native UI elements (real buttons, real scroll views, real maps).

**React** itself is a UI library for building interfaces out of **components**. React Native takes React and targets phones instead of browsers.

## What is Expo?

Expo is a **toolkit and platform** built on top of React Native that makes everything easier:

- **No Xcode/Android Studio needed** for most development
- **Instant reload**: Change code, see it on your phone immediately
- **Easy access to device features**: Camera, location, notifications - one `npx expo install` away
- **OTA updates**: Push updates without going through the App Store
- **Build service**: Compile your app in the cloud (EAS Build)

Think of it this way: React Native is the engine, Expo is the car built around it.

## Core Concepts

### 1. Components

Everything in React Native is a **component** - a reusable building block.

```tsx
// DiveSpotCard.tsx
import { View, Text, Image, TouchableOpacity } from "react-native";

// A component is just a function that returns UI
export function DiveSpotCard({ spot }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: spot.photoUrl }} style={styles.image} />
      <Text style={styles.title}>{spot.name}</Text>
      <Text style={styles.subtitle}>{spot.depth}m deep</Text>
      <TouchableOpacity onPress={() => console.log("tapped!")}>
        <Text>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Key differences from web React:
| Web (React) | Mobile (React Native) |
|-------------|----------------------|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1>` | `<Text>` (all text must be in `<Text>`) |
| `<img>` | `<Image>` |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| `<input>` | `<TextInput>` |
| `<ul>` + `<li>` | `<FlatList>` |
| CSS files | `StyleSheet.create()` or inline styles |

### 2. State and Props

**Props** = data passed INTO a component (from parent):
```tsx
// Parent passes data via props
<DiveSpotCard spot={mySpot} />

// Child receives props
function DiveSpotCard({ spot }: { spot: DiveSpot }) {
  return <Text>{spot.name}</Text>;
}
```

**State** = data managed WITHIN a component (can change over time):
```tsx
import { useState } from "react";

function DepthCounter() {
  // useState returns [currentValue, setterFunction]
  const [depth, setDepth] = useState(0);

  return (
    <View>
      <Text>Depth: {depth}m</Text>
      <TouchableOpacity onPress={() => setDepth(depth + 1)}>
        <Text>Go deeper</Text>
      </TouchableOpacity>
    </View>
  );
}
```

When state changes, the component **re-renders** (redraws) automatically.

### 3. Hooks

Hooks are special functions that let components "hook into" React features. They all start with `use`:

```tsx
// useState - manage local state
const [isLoading, setIsLoading] = useState(false);

// useEffect - run side effects (API calls, subscriptions)
useEffect(() => {
  // This runs when the component first appears on screen
  fetchDiveSpots();
}, []); // Empty array = run once. [someVar] = run when someVar changes

// useCallback - memoize a function (performance optimization)
const handlePress = useCallback(() => {
  navigation.navigate("SpotDetail", { id: spot.id });
}, [spot.id]);
```

### 4. Navigation (Moving Between Screens)

We use **React Navigation** to move between screens:

```tsx
// App.tsx - Define your screens
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SpotDetail" component={SpotDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Navigate from one screen to another
function HomeScreen({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("SpotDetail", { id: "abc-123" })}
    >
      <Text>Go to spot</Text>
    </TouchableOpacity>
  );
}

// Receive parameters on the destination screen
function SpotDetailScreen({ route }) {
  const { id } = route.params; // "abc-123"
  // Fetch and display the spot...
}
```

### 5. Styling

No CSS files. Styles are JavaScript objects:

```tsx
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow (Android)
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
});

// Usage:
<View style={styles.card}>
  <Text style={styles.title}>Blue Hole</Text>
</View>
```

Key style differences from CSS:
- camelCase instead of kebab-case (`fontSize` not `font-size`)
- Numbers instead of strings for most values (`padding: 16` not `padding: "16px"`)
- **Flexbox is the default layout** (and the only layout system)
- No cascading - styles don't inherit from parents (except text color/font within `<Text>`)

### 6. Flexbox Layout (Quick Reference)

Everything is flexbox. The main properties:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Take up all available space
    flexDirection: "column",    // Stack children vertically (default)
    // flexDirection: "row",    // Stack children horizontally
    justifyContent: "center",   // Center vertically (in column mode)
    alignItems: "center",       // Center horizontally (in column mode)
    gap: 12,                    // Space between children
  },
});
```

### 7. Calling the API

To fetch data from your NestJS backend:

```tsx
import { useEffect, useState } from "react";

function DiveSpotList() {
  const [spots, setSpots] = useState<DiveSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpots() {
      try {
        const response = await fetch("http://localhost:3000/dive-spots");
        const data = await response.json();
        setSpots(data);
      } catch (error) {
        console.error("Failed to load spots:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSpots();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={spots}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <DiveSpotCard spot={item} />}
    />
  );
}
```

## Project Structure (Expo)

```
apps/mobile/
  app/                    # Screens (if using Expo Router)
    (tabs)/
      index.tsx           # Home tab
      explore.tsx         # Explore tab
    spot/
      [id].tsx            # Dynamic route: /spot/abc-123
    _layout.tsx           # Root layout (navigation structure)
  components/             # Reusable UI components
    DiveSpotCard.tsx
    Button.tsx
  hooks/                  # Custom hooks
    useDiveSpots.ts
  services/               # API call functions
    api.ts
  constants/              # Colors, config
  assets/                 # Images, fonts
  app.json                # Expo configuration
  package.json
```

## Essential Commands

```bash
# Start the development server
npx expo start

# This shows a QR code and options:
#   Press 'i' for iOS simulator
#   Press 'a' for Android emulator
#   Scan QR with Expo Go app on your physical phone

# Install a package (use this instead of pnpm add for Expo packages)
npx expo install expo-location
npx expo install expo-camera
npx expo install expo-image-picker

# Build for production (using EAS)
eas build --platform ios
eas build --platform android

# Clear cache (when things are weird)
npx expo start --clear
```

### Why `npx expo install` instead of `pnpm add`?

`npx expo install` picks the version of the package that's **compatible with your Expo version**. Using `pnpm add` might install an incompatible version.

## Expo Go vs Development Build

- **Expo Go**: A pre-built app you download from the App Store. Scan QR code to preview your app. Easy but limited (can't use all native features).
- **Development Build**: A custom version of Expo Go that includes any native code your app needs. Needed when you use libraries that require native code (e.g., maps).

For early development, Expo Go is fine. You'll switch to dev builds when you need native features.

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `Network request failed` | Your phone can't reach localhost. Use your computer's IP instead. Or use Expo's tunneling: `npx expo start --tunnel` |
| `Text strings must be rendered within a <Text>` | All text must be inside `<Text>` tags. Even spaces between components. |
| `VirtualizedLists should never be nested` | Don't put a `FlatList` inside a `ScrollView`. Use `FlatList`'s `ListHeaderComponent` instead. |
| Styles not applying | No typos? Remember: no CSS cascade. Each component styles independently. |
| `Unable to resolve module` | Run `npx expo start --clear` or delete `node_modules` and reinstall |
| App crashes without error | Check the terminal/console. Also try: `npx expo start --clear` |
| Slow on Android emulator | Use a physical device or reduce emulator RAM/resolution |

## Learn More

- [React Native Docs](https://reactnative.dev/docs/getting-started) - Core concepts
- [Expo Docs](https://docs.expo.dev) - Expo-specific guides
- [React Navigation](https://reactnavigation.org/docs/getting-started) - Navigation library docs
