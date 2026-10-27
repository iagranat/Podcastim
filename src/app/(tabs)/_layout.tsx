import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { AudioPlayerMini } from '../../components/AudioPlayerMini';

export default function TabsLayout() {
  const { theme, mode } = useApp();
  const isKids = mode === 'kids';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
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

      {/* Floating mini player docked above bottom navigation */}
      <View style={styles.miniPlayerWrapper}>
        <AudioPlayerMini />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    bottom: 64, // Directly above the 64px tab bar
    left: 0,
    right: 0,
  },
});
