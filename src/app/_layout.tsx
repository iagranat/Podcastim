import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../context/AppContext';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { AudioPlayerModal } from '../components/AudioPlayerModal';

function RootNavigation() {
  const { theme, mode } = useApp();

  return (
    <>
      <StatusBar style={mode === 'kids' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="podcast/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
      <AudioPlayerModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AudioPlayerProvider>
          <RootNavigation />
        </AudioPlayerProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
