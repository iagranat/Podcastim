import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useApp } from '../context/AppContext';
import { formatTime, formatSleepTimerRemaining } from '../utils/format';
import { SleepTimerModal } from './SleepTimerModal';

const { width } = Dimensions.get('window');

export const AudioPlayerModal: React.FC = () => {
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    playbackRate,
    isPlayerModalVisible,
    sleepTimerRemaining,
    errorMessage,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    playNext,
    playPrevious,
    setPlaybackRate,
    closePlayerModal,
  } = useAudioPlayer();

  const { theme, mode, isFavorite, toggleFavorite } = useApp();
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingPosition, setSeekingPosition] = useState(0);

  if (!currentEpisode) return null;

  const isKids = mode === 'kids';
  const displayPosition = isSeeking ? seekingPosition : positionMs;
  const progress = durationMs > 0 ? displayPosition / durationMs : 0;
  const isFav = isFavorite(currentEpisode.podcastId);

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.2, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  return (
    <Modal
      visible={isPlayerModalVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePlayerModal}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={closePlayerModal}
            style={[styles.roundIconBtn, { backgroundColor: theme.colors.card }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={26} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.topCenterText}>
            <Text style={[styles.nowPlayingText, { color: theme.colors.textSecondary }]}>
              {isKids ? '🎉 משמיע עכשיו' : 'משמיע כעת'}
            </Text>
          </View>

          {/* Sleep Timer Button */}
          <TouchableOpacity
            onPress={() => setIsSleepModalOpen(true)}
            style={[
              styles.sleepTimerBtn,
              {
                backgroundColor: sleepTimerRemaining ? theme.colors.primaryLight : theme.colors.card,
              },
            ]}
          >
            <Ionicons
              name={sleepTimerRemaining ? 'moon' : 'moon-outline'}
              size={20}
              color={sleepTimerRemaining ? theme.colors.primary : theme.colors.text}
            />
            {sleepTimerRemaining !== null && (
              <Text style={[styles.timerBadgeText, { color: theme.colors.primary }]}>
                {formatSleepTimerRemaining(sleepTimerRemaining)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.secondaryLight }]}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.secondary} />
            <Text style={[styles.errorText, { color: theme.colors.secondary }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <View
            style={[
              styles.artworkShadowWrapper,
              {
                shadowColor: isKids ? theme.colors.primary : '#000',
                borderRadius: isKids ? 32 : 20,
              },
            ]}
          >
            <Image
              source={{ uri: currentEpisode.podcastImage }}
              cachePolicy="memory-disk"
              transition={200}
              contentFit="cover"
              style={[
                styles.artwork,
                {
                  borderRadius: isKids ? 32 : 20,
                },
              ]}
            />
          </View>
        </View>

        {/* Episode Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={[styles.episodeTitle, { color: theme.colors.text }]}>
                {currentEpisode.title}
              </Text>
              <Text numberOfLines={1} style={[styles.podcastTitle, { color: theme.colors.textSecondary }]}>
                {currentEpisode.podcastTitle}
              </Text>
            </View>

            {/* Favorite Bookmark Button */}
            <TouchableOpacity
              onPress={() =>
                toggleFavorite({
                  id: currentEpisode.podcastId,
                  title: currentEpisode.podcastTitle,
                  imageUrl: currentEpisode.podcastImage,
                  slug: '',
                  link: '',
                  categories: [],
                  excerpt: '',
                  episodeCount: 0,
                  episodes: [],
                  isKidFriendly: true,
                  date: '',
                })
              }
              style={[
                styles.favButton,
                {
                  backgroundColor: isFav ? theme.colors.secondaryLight : theme.colors.card,
                },
              ]}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={26}
                color={isFav ? theme.colors.secondary : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrubber & Time */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={durationMs > 0 ? durationMs : 1}
            value={displayPosition}
            onValueChange={(val) => {
              setIsSeeking(true);
              setSeekingPosition(val);
            }}
            onSlidingComplete={async (val) => {
              await seekTo(val);
              setIsSeeking(false);
            }}
            minimumTrackTintColor={isKids ? theme.colors.secondary : theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={isKids ? theme.colors.secondary : theme.colors.primary}
          />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              {formatTime(displayPosition)}
            </Text>
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
              {formatTime(durationMs)}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsContainer}>
          {/* Previous Episode */}
          <TouchableOpacity
            onPress={playPrevious}
            style={styles.auxControlBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={26} color={theme.colors.text} />
          </TouchableOpacity>

          {/* 15s Back */}
          <TouchableOpacity
            onPress={() => skipBackward(15)}
            style={styles.skipBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.skipBadge, { color: theme.colors.text }]}>15-</Text>
          </TouchableOpacity>

          {/* Center Play / Pause */}
          <TouchableOpacity
            onPress={togglePlayPause}
            style={[
              styles.mainPlayBtn,
              {
                backgroundColor: isKids ? theme.colors.primary : theme.colors.primary,
                borderRadius: isKids ? 40 : 36,
                shadowColor: isKids ? theme.colors.primary : '#000',
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={isKids ? 42 : 36}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 4 }}
              />
            )}
          </TouchableOpacity>

          {/* 15s Forward */}
          <TouchableOpacity
            onPress={() => skipForward(15)}
            style={styles.skipBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="reload-outline" size={24} color={theme.colors.text} />
            <Text style={[styles.skipBadge, { color: theme.colors.text }]}>15+</Text>
          </TouchableOpacity>

          {/* Next Episode */}
          <TouchableOpacity
            onPress={playNext}
            style={styles.auxControlBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={26} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Bottom Options: Speed & Share */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={cycleSpeed}
            style={[styles.speedPill, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="speedometer-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.speedText, { color: theme.colors.text }]}>
              {playbackRate}x
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Timer Picker Modal */}
        <SleepTimerModal
          visible={isSleepModalOpen}
          onClose={() => setIsSleepModalOpen(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenterText: {
    alignItems: 'center',
  },
  nowPlayingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sleepTimerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  artworkShadowWrapper: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  artwork: {
    width: width * 0.76,
    height: width * 0.76,
    maxWidth: 320,
    maxHeight: 320,
    backgroundColor: '#E5E7EB',
  },
  infoContainer: {
    marginVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  episodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 26,
  },
  podcastTitle: {
    fontSize: 15,
    marginTop: 6,
    textAlign: 'left',
  },
  favButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  progressContainer: {
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  auxControlBtn: {
    padding: 10,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  skipBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mainPlayBtn: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  speedText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
