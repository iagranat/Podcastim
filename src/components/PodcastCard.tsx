import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Podcast } from '../api/types';
import { useApp } from '../context/AppContext';

interface PodcastCardProps {
  podcast: Podcast;
  horizontal?: boolean;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ podcast, horizontal = false }) => {
  const { theme, mode, isFavorite, toggleFavorite } = useApp();
  const isKids = mode === 'kids';
  const isFav = isFavorite(podcast.id);

  const handlePress = () => {
    router.push({
      pathname: '/podcast/[id]',
      params: { id: podcast.id, title: podcast.title },
    });
  };

  if (horizontal) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={[
          styles.horizontalCard,
          {
            backgroundColor: theme.colors.card,
            borderRadius: isKids ? 20 : 12,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <Image
          source={{ uri: podcast.imageUrl }}
          cachePolicy="memory-disk"
          transition={200}
          style={[styles.horizontalImage, { borderRadius: isKids ? 16 : 10 }]}
        />
        <View style={styles.horizontalContent}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {podcast.title}
          </Text>
          {podcast.excerpt ? (
            <Text numberOfLines={2} style={[styles.excerpt, { color: theme.colors.textSecondary }]}>
              {podcast.excerpt}
            </Text>
          ) : null}
          <View style={styles.badgeRow}>
            {podcast.rating !== undefined && podcast.rating > 0 && (
              <View style={[styles.badge, styles.ratingBadge]}>
                <Ionicons name="star" size={12} color="#D97706" style={{ marginLeft: 3 }} />
                <Text style={styles.ratingText}>
                  {podcast.rating}
                  {podcast.ratingCount ? ` (${podcast.ratingCount})` : ''}
                </Text>
              </View>
            )}
            {podcast.episodeCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isKids ? theme.colors.primaryLight : theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isKids ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {podcast.episodeCount} פרקים
                </Text>
              </View>
            )}
            {isKids && podcast.isKidFriendly && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accentLight }]}>
                <Text style={[styles.badgeText, { color: '#D35400' }]}>🧸 מתאים לילדים</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(podcast)}
          style={styles.favBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={22}
            color={isFav ? theme.colors.secondary : theme.colors.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.gridCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: isKids ? 22 : 14,
          borderColor: isKids ? theme.colors.primaryLight : theme.colors.border,
          borderWidth: 1,
          shadowColor: isKids ? theme.colors.primary : '#000',
        },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: podcast.imageUrl }}
          cachePolicy="memory-disk"
          transition={200}
          contentFit="cover"
          style={[styles.gridImage, { borderTopLeftRadius: isKids ? 21 : 13, borderTopRightRadius: isKids ? 21 : 13 }]}
        />
        <TouchableOpacity
          onPress={() => toggleFavorite(podcast)}
          style={[styles.favBadge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? theme.colors.secondary : '#7F8C8D'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.gridContent}>
        <Text numberOfLines={2} style={[styles.gridTitle, { color: theme.colors.text }]}>
          {podcast.title}
        </Text>
        <View style={styles.gridFooter}>
          {podcast.rating !== undefined && podcast.rating > 0 && (
            <View style={[styles.badge, styles.ratingBadge]}>
              <Ionicons name="star" size={11} color="#D97706" style={{ marginLeft: 2 }} />
              <Text style={styles.ratingText}>
                {podcast.rating}
                {podcast.ratingCount ? ` (${podcast.ratingCount})` : ''}
              </Text>
            </View>
          )}
          {podcast.episodeCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: isKids ? theme.colors.primaryLight : theme.colors.border },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isKids ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {podcast.episodeCount} פרקים
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    width: '48%',
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 74,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  gridFooter: {
    marginTop: 6,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  horizontalCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  horizontalImage: {
    width: 68,
    height: 68,
    backgroundColor: '#E5E7EB',
  },
  horizontalContent: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  excerpt: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
  },
  favBtn: {
    padding: 8,
  },
});
