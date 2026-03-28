import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/contexts/AppContext";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { Lato_400Regular, Lato_700Bold } from "@expo-google-fonts/lato";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", contentStyle: { backgroundColor: Colors.canvas } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="intake" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="prompt-response" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="journal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="new-memory" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="new-journal" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="prompt-detail" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="view-memory" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="add-task" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="take-quiz" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="quiz-results" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="scenario-intro" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="roleplay-chat" options={{ headerShown: false, presentation: 'modal', gestureEnabled: false }} />
      <Stack.Screen name="roleplay-feedback" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <AppProvider>
              <RootLayoutNav />
            </AppProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
