import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { fetchPodcastById } from '../../api/podcastim';
import { Podcast, EpisodeSortOption } from '../../api/types';
import { EpisodeItem } from '../../components/EpisodeItem';
import { AudioPlayerMini } from '../../components/AudioPlayerMini';

export default function PodcastDetailScreen() {
  const { id, ep, episode } = useLocalSearchParams<{ id: string; ep?: string; episode?: string }>();
  const { theme, mode, isFavorite, toggleFavorite } = useApp();
  const { playEpisode, currentEpisode } = useAudioPlayer();
  const insets = useSafeAreaInsets();
  const isKids = mode === 'kids';
  // Compute safe bottom padding. On Android with 3-button nav, insets.bottom can report 0 despite system buttons (~48dp).
  // Enforce a minimum safe bottom inset of 48dp on Android when insets.bottom < 20dp.
  const safeBottom = Platform.OS === 'android'
    ? (insets.bottom >= 20 ? insets.bottom : 48)
    : Math.max(insets.bottom, 12);

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [episodesOrder, setEpisodesOrder] = useState<EpisodeSortOption>('asc');

  useEffect(() => {
    async function loadPodcast() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPodcastById(id);
        setPodcast(data);

        // Auto-play targeted episode if deep link specifies ?ep= or ?episode=
        const targetEp = ep || episode;
        if (targetEp && data.episodes && data.episodes.length > 0) {
          const targetStr = decodeURIComponent(targetEp).trim().toLowerCase();
          const targetEpisode = data.episodes.find(
            (e, idx) =>
              e.id.toLowerCase() === targetStr ||
              String(idx + 1) === targetStr ||
              e.title.toLowerCase().includes(targetStr)
          );
          if (targetEpisode) {
            playEpisode(targetEpisode, data.episodes);
          }
        }
      } catch (e: any) {
        console.warn('Failed to load podcast:', e);
        setError('לא ניתן לטעון את הפודקאסט. נסו שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    }
    loadPodcast();
  }, [id, ep, episode]);

  const isFav = podcast ? isFavorite(podcast.id) : false;

  const handleShare = async () => {
    if (!podcast) return;
    try {
      const shareUrl = podcast.link || `https://podcastim.org.il/?p=${podcast.id}`;
      await Share.share({
        title: podcast.title,
        message: `האזינו לפודקאסט "${podcast.title}" באתר הפודקאסטים הישראלי: ${shareUrl}`,
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const handlePlayAll = () => {
    if (podcast && podcast.episodes.length > 0) {
      playEpisode(podcast.episodes[0], podcast.episodes);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Top Nav Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: theme.colors.card }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.navActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.navBtn, { backgroundColor: theme.colors.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-social-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          {podcast && (
            <TouchableOpacity
              onPress={() => toggleFavorite(podcast)}
              style={[
                styles.navBtn,
                {
                  backgroundColor: isFav ? theme.colors.secondaryLight : theme.colors.card,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? theme.colors.secondary : theme.colors.text}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            טוען פרקים מ-podcastim.org.il...
          </Text>
        </View>
      ) : null}

      {/* Error */}
      {error && !loading ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.secondary} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.retryBtnText}>חזרה</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Podcast Content */}
      {podcast && !loading && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 80 + safeBottom + (currentEpisode ? 85 : 0) },
          ]}
        >
          {/* Header Section: Image + Title */}
          <View style={styles.podcastHeader}>
            <Image
              source={{ uri: podcast.imageUrl }}
              cachePolicy="memory-disk"
              transition={200}
              contentFit="cover"
              style={[styles.coverImage, { borderRadius: isKids ? 24 : 16 }]}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>{podcast.title}</Text>

            {/* Rating Section */}
            {podcast.rating !== undefined && podcast.rating > 0 && (
              <View style={styles.ratingSection}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const diff = (podcast.rating || 0) - (starIndex - 1);
                    const iconName =
                      diff >= 0.75
                        ? 'star'
                        : diff >= 0.25
                        ? 'star-half'
                        : 'star-outline';
                    return (
                      <Ionicons
                        key={starIndex}
                        name={iconName}
                        size={18}
                        color="#F59E0B"
                        style={[
                          styles.starIcon,
                          iconName === 'star-half' && styles.starHalfRtl,
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={[styles.ratingScore, { color: theme.colors.text }]}>
                  {podcast.rating.toFixed(1)}
                </Text>
                {podcast.ratingCount ? (
                  <Text style={[styles.ratingCountText, { color: theme.colors.textSecondary }]}>
                    ({podcast.ratingCount} דירוגים באתר)
                  </Text>
                ) : null}
              </View>
            )}

            {podcast.isKidFriendly && (
              <View style={[styles.kidBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.kidBadgeText, { color: theme.colors.primary }]}>
                  🧸 מתאים במיוחד לילדים
                </Text>
              </View>
            )}

            {/* Play All Button */}
            {podcast.episodes.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePlayAll}
                style={[
                  styles.playAllButton,
                  {
                    backgroundColor: isKids ? theme.colors.primary : theme.colors.primary,
                    borderRadius: isKids ? 24 : 16,
                  },
                ]}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.playAllText}>האזינו לפרק הראשון</Text>
              </TouchableOpacity>
            )}

            {/* Excerpt / Description */}
            {podcast.excerpt ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setDescExpanded(!descExpanded)}
                style={styles.descBox}
              >
                <Text
                  numberOfLines={descExpanded ? undefined : 3}
                  style={[styles.descText, { color: theme.colors.textSecondary }]}
                >
                  {podcast.excerpt}
                </Text>
                <Text style={[styles.readMoreText, { color: theme.colors.primary }]}>
                  {descExpanded ? 'הצג פחות' : 'קרא עוד...'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Episodes List Section */}
          <View style={styles.episodesSection}>
            <View style={styles.episodesHeader}>
              <View style={styles.episodesTitleGroup}>
                <Text style={[styles.episodesTitle, { color: theme.colors.text }]}>
                  רשימת פרקים
                </Text>
                <Text style={[styles.episodesBadge, { color: theme.colors.textSecondary }]}>
                  ({podcast.episodes.length} פרקים זמינים)
                </Text>
              </View>

              {podcast.episodes.length > 1 && (
                <TouchableOpacity
                  onPress={() => setEpisodesOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  style={[
                    styles.sortToggleBtn,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      borderRadius: isKids ? 16 : 10,
                    },
                  ]}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={episodesOrder === 'asc' ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.sortToggleText, { color: theme.colors.primary }]}>
                    {episodesOrder === 'asc' ? 'מהראשון לאחרון' : 'מהאחרון לראשון'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {podcast.episodes.length > 0 ? (
              (() => {
                const displayedEpisodes =
                  episodesOrder === 'asc' ? podcast.episodes : [...podcast.episodes].reverse();
                return displayedEpisodes.map((ep, idx) => (
                  <EpisodeItem
                    key={ep.id}
                    episode={ep}
                    playlist={displayedEpisodes}
                    index={idx}
                  />
                ));
              })()
            ) : (
              <View style={styles.noEpisodesBox}>
                <Ionicons name="information-circle-outline" size={36} color={theme.colors.textMuted} />
                <Text style={[styles.noEpisodesText, { color: theme.colors.textSecondary }]}>
                  פרקי פודקאסט זה מתעדכנים ישירות מהאתר.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Mini Player */}
      {currentEpisode ? (
        <View style={[styles.miniPlayerContainer, { bottom: safeBottom + 6 }]}>
          <AudioPlayerMini />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  podcastHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  coverImage: {
    width: 180,
    height: 180,
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 28,
  },
  ratingSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  starsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 1,
  },
  starHalfRtl: {
    transform: [{ scaleX: -1 }],
  },
  ratingScore: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  ratingCountText: {
    fontSize: 13,
  },
  kidBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  kidBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  descBox: {
    marginTop: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  episodesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  episodesTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  episodesBadge: {
    fontSize: 13,
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noEpisodesBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEpisodesText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
