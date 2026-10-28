import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Episode } from '../api/types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useApp } from '../context/AppContext';

interface EpisodeItemProps {
  episode: Episode;
  playlist: Episode[];
  index: number;
}

export const EpisodeItem: React.FC<EpisodeItemProps> = ({ episode, playlist, index }) => {
  const { currentEpisode, isPlaying, isLoading, playEpisode, togglePlayPause } = useAudioPlayer();
  const { theme, mode, isEpisodeListened, toggleEpisodeListened } = useApp();
  const [expanded, setExpanded] = useState(false);

  const isCurrent = currentEpisode?.id === episode.id;
  const isListened = isEpisodeListened(episode.id);
  const isKids = mode === 'kids';

  const handlePress = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playEpisode(episode, playlist);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCurrent
            ? isKids
              ? theme.colors.primaryLight
              : 'rgba(72, 52, 212, 0.15)'
            : theme.colors.card,
          borderColor: isCurrent
            ? theme.colors.primary
            : theme.colors.border,
          borderRadius: isKids ? 18 : 12,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.mainRow}>
        {/* Play/Pause Circle Button */}
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.playCircle,
            {
              backgroundColor: isCurrent && isPlaying
                ? theme.colors.primary
                : isKids
                ? theme.colors.secondaryLight
                : theme.colors.border,
            },
          ]}
        >
          {isCurrent && isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons
              name={isCurrent && isPlaying ? 'pause' : 'play'}
              size={18}
              color={
                isCurrent && isPlaying
                  ? '#FFFFFF'
                  : isKids
                  ? theme.colors.secondary
                  : theme.colors.text
              }
              style={{ marginLeft: isCurrent && isPlaying ? 0 : 2 }}
            />
          )}
        </TouchableOpacity>

        {/* Title, Duration, Date */}
        <View style={styles.infoCol}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: isCurrent ? theme.colors.primary : theme.colors.text,
                fontWeight: isCurrent ? 'bold' : '600',
              },
            ]}
          >
            {episode.title}
          </Text>

          <View style={styles.metaRow}>
            {episode.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {episode.duration}
                </Text>
              </View>
            )}

            {episode.date && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  {episode.date}
                </Text>
              </View>
            )}

            {isListened && (
              <View
                style={[
                  styles.listenedBadge,
                  { backgroundColor: isKids ? '#D1FAE5' : 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={styles.listenedBadgeText}>הושמע</Text>
              </View>
            )}

            {isCurrent && (
              <View
                style={[
                  styles.playingBadge,
                  { backgroundColor: isKids ? theme.colors.secondary : theme.colors.primary },
                ]}
              >
                <Text style={styles.playingBadgeText}>
                  {isPlaying ? 'מתנגן עכשיו' : 'מושהה'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Toggle Listened Button */}
        <TouchableOpacity
          onPress={() => toggleEpisodeListened(episode.id)}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isListened ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={22}
            color={isListened ? '#10B981' : theme.colors.textMuted}
          />
        </TouchableOpacity>

        {/* Description Expander Toggle */}
        {episode.description ? (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.expandBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* Expanded Description */}
      {expanded && episode.description ? (
        <View style={styles.descriptionBox}>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            {episode.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
  },
  playingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  playingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listenedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listenedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  expandBtn: {
    padding: 6,
    marginLeft: 6,
  },
  descriptionBox: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
});
