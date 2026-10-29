import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { PodcastCard } from '../../components/PodcastCard';
import { KidsHeroBanner } from '../../components/KidsHeroBanner';
import { ModeSwitchPill } from '../../components/ModeSwitchPill';
import { fetchPodcasts, fetchCategories, getOrLoadCatalogIndex, sortPodcasts, KIDS_CATEGORY_ID } from '../../api/podcastim';
import { Podcast, Category, PodcastSortOption } from '../../api/types';
import { KidsTopic } from '../../constants/kidsTopics';

export default function HomeScreen() {
  const { theme, mode } = useApp();
  const isKids = mode === 'kids';

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    isKids ? KIDS_CATEGORY_ID : undefined
  );
  const [sortBy, setSortBy] = useState<PodcastSortOption>('date');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const catId = isKids ? KIDS_CATEGORY_ID : selectedCategory;
      const [fetchedPodcasts, fetchedCats] = await Promise.all([
        fetchPodcasts({
          categoryId: catId,
          perPage: 16,
          onBackgroundUpdate: (fresh) => {
            setPodcasts(fresh);
          },
        }),
        fetchCategories(),
      ]);
      setPodcasts(fetchedPodcasts);
      setCategories(fetchedCats);
    } catch (e: any) {
      console.warn('Error loading home data:', e);
      if (podcasts.length === 0) {
        setError('לא ניתן לטעון נתונים. בדקו את החיבור לאינטרנט.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isKids, selectedCategory, podcasts.length]);

  useEffect(() => {
    setLoading(true);
    loadData();
    // Pre-cache full catalog index in the background for instant search & offline browsing
    getOrLoadCatalogIndex().catch(() => {});
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTopicSelect = (topic: KidsTopic) => {
    router.push({
      pathname: '/search',
      params: { q: topic.query },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandTitle, { color: theme.colors.text }]}>
            {isKids ? 'פודקאסטים לילדים 🎈' : 'פודקאסטים 🎙️'}
          </Text>
          <Text style={[styles.brandDomain, { color: theme.colors.primary }]}>
            podcastim.org.il
          </Text>
        </View>

        <ModeSwitchPill />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Kids Banner or Adult Categories */}
        {isKids ? (
          <KidsHeroBanner onSelectTopic={handleTopicSelect} />
        ) : (
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(undefined)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: selectedCategory === undefined ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    { color: selectedCategory === undefined ? '#FFFFFF' : theme.colors.text },
                  ]}
                >
                  הכל
                </Text>
              </TouchableOpacity>

              {categories.slice(0, 15).map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.text },
                      ]}
                    >
                      {cat.name} ({cat.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Loading Spinner */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              טוען פודקאסטים עדכניים...
            </Text>
          </View>
        ) : null}

        {/* Error message with retry */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.secondary} />
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>{error}</Text>
            <TouchableOpacity
              onPress={loadData}
              style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.retryBtnText}>נסו שוב</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Podcasts Grid Section */}
        {!loading && !error && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {isKids ? '⭐ פודקאסטים מומלצים' : 'פודקאסטים מובילים'}
              </Text>
              <Text style={[styles.countBadge, { color: theme.colors.textSecondary }]}>
                ({podcasts.length} פודקאסטים)
              </Text>
            </View>

            {/* Sort Mechanism Bar */}
            {podcasts.length > 1 && (
              <View style={styles.sortBar}>
                <Text style={[styles.sortLabel, { color: theme.colors.textSecondary }]}>מיון:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortOptionsRow}
                >
                  <TouchableOpacity
                    onPress={() => setSortBy('date')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'date' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'date' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKids ? 16 : 10,
                      },
                    ]}
                  >
                    <Text style={[styles.sortPillText, { color: sortBy === 'date' ? '#FFFFFF' : theme.colors.text }]}>
                      🕒 תאריך עדכון
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy('rating')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'rating' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'rating' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKids ? 16 : 10,
                      },
                    ]}
                  >
                    <Text style={[styles.sortPillText, { color: sortBy === 'rating' ? '#FFFFFF' : theme.colors.text }]}>
                      ⭐ דירוג גבוה
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy('name')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'name' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'name' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKids ? 16 : 10,
                      },
                    ]}
                  >
                    <Text style={[styles.sortPillText, { color: sortBy === 'name' ? '#FFFFFF' : theme.colors.text }]}>
                      🔤 שם (א-ת)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            <View style={styles.grid}>
              {sortPodcasts(podcasts, sortBy).map((podcast) => (
                <PodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    alignItems: 'flex-end',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  brandDomain: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Leave space for mini player + tabs
  },
  categoriesBar: {
    paddingVertical: 10,
  },
  catsScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    writingDirection: 'rtl',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
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
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  countBadge: {
    fontSize: 13,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
