import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { AudioPlayerMini } from '../../components/AudioPlayerMini';

export default function TabsLayout() {
  const { theme, mode } = useApp();
  const { currentEpisode } = useAudioPlayer();
  const insets = useSafeAreaInsets();
  const isKids = mode === 'kids';

  // Compute safe bottom padding. On Android with 3-button nav, insets.bottom can report 0 despite system buttons (~48dp).
  // Enforce a minimum safe bottom inset of 48dp on Android when insets.bottom < 20dp.
  const safeBottom = Platform.OS === 'android'
    ? (insets.bottom >= 20 ? insets.bottom : 48)
    : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + safeBottom;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: safeBottom,
            paddingTop: 6,
          },
          tabBarActiveTintColor: isKids ? theme.colors.primary : theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: isKids ? 12 : 11,
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isKids ? 'ראשי' : 'בית',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? (isKids ? 'happy' : 'home') : (isKids ? 'happy-outline' : 'home-outline')}
                size={isKids ? 26 : 22}
                color={String(color)}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: 'חיפוש',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={isKids ? 26 : 22}
                color={String(color)}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="favorites"
          options={{
            title: isKids ? 'אהובים' : 'מועדפים',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={isKids ? 26 : 22}
                color={String(color)}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: isKids ? 'הורים' : 'הגדרות',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={isKids ? 26 : 22}
                color={String(color)}
              />
            ),
          }}
        />
      </Tabs>

      {/* Floating mini player docked safely above bottom navigation */}
      {currentEpisode ? (
        <View style={[styles.miniPlayerWrapper, { bottom: tabBarHeight + 6 }]}>
          <AudioPlayerMini />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
