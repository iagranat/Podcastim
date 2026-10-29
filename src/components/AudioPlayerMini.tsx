import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useApp } from '../context/AppContext';

export const AudioPlayerMini: React.FC = () => {
  const { currentEpisode, isPlaying, isLoading, positionMs, durationMs, togglePlayPause, openPlayerModal, skipForward } =
    useAudioPlayer();
  const { theme, mode } = useApp();

  if (!currentEpisode) return null;

  const progress = durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;
  const isKids = mode === 'kids';

  return (
    <View style={[styles.outerContainer, { shadowColor: theme.colors.primary }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openPlayerModal}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.card,
            borderColor: isKids ? theme.colors.primaryLight : theme.colors.border,
            borderRadius: isKids ? 20 : 14,
          },
        ]}
      >
        {/* Progress Bar at Top */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: isKids ? theme.colors.secondary : theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.contentRow}>
          {/* Episode Artwork */}
          <Image
            source={{ uri: currentEpisode.podcastImage }}
            cachePolicy="memory-disk"
            transition={150}
            style={[styles.thumbnail, { borderRadius: isKids ? 14 : 8 }]}
          />

          {/* Episode & Podcast Titles */}
          <View style={styles.textContainer}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
              {currentEpisode.title}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {currentEpisode.podcastTitle}
            </Text>
          </View>

          {/* Controls: Skip 15s & Play/Pause */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => skipForward(15)}
              style={styles.controlButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="play-forward"
                size={isKids ? 22 : 18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={[
                styles.playButton,
                {
                  backgroundColor: isKids ? theme.colors.primary : theme.colors.primary,
                  borderRadius: isKids ? 22 : 18,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={isKids ? 22 : 18}
                  color="#FFFFFF"
                  style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingBottom: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  thumbnail: {
    width: 46,
    height: 46,
    backgroundColor: '#E1E2E6',
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'left',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 6,
  },
  playButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
