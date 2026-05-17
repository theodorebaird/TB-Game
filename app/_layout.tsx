import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useMetaStore } from "@state/metaStore";

export default function RootLayout() {
  const load = useMetaStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#1a0f08" }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a0f08" },
          headerTintColor: "#dbb98b",
          contentStyle: { backgroundColor: "#1a0f08" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="match" options={{ headerShown: false }} />
        <Stack.Screen name="bunker" options={{ title: "The Bunker" }} />
        <Stack.Screen name="tutorial" options={{ title: "Tutorial" }} />
        <Stack.Screen name="new-game" options={{ title: "New Game" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
