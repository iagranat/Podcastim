import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { PodcastCard } from '../../components/PodcastCard';
import {
  searchPodcastsPaginated,
  sortPodcasts,
  KIDS_CATEGORY_ID,
} from '../../api/podcastim';
import { Podcast } from '../../api/types';
import { KIDS_TOPICS } from '../../constants/kidsTopics';

type SearchSortOption = 'relevance' | 'rating' | 'date' | 'name';
type SearchScope = 'all' | 'kids';

export default function SearchScreen() {
  const { theme, mode } = useApp();
  const { currentEpisode } = useAudioPlayer();
  const isKidsMode = mode === 'kids';
  const localParams = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(localParams.q || '');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [results, setResults] = useState<Podcast[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [scope, setScope] = useState<SearchScope>('all');
  const [sortBy, setSortBy] = useState<SearchSortOption>('relevance');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchRequestIdRef = useRef(0);

  const performSearch = useCallback(
    async (searchTerm: string, targetScope: SearchScope = scope) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        setActiveSearchTerm('');
        return;
      }

      Keyboard.dismiss();
      const requestId = ++searchRequestIdRef.current;
      setLoading(true);
      setHasSearched(true);
      setActiveSearchTerm(trimmed);
      setPage(1);

      const categoryId = targetScope === 'kids' ? KIDS_CATEGORY_ID : undefined;

      try {
        const response = await searchPodcastsPaginated({
          query: trimmed,
          page: 1,
          perPage: 10,
          categoryId,
        });

        if (requestId === searchRequestIdRef.current) {
          setResults(response.podcasts);
          setTotalResults(response.totalResults);
          setTotalPages(response.totalPages);
          setPage(1);
        }
      } catch (e) {
        console.warn('Search error:', e);
        if (requestId === searchRequestIdRef.current) {
          setResults([]);
          setTotalResults(0);
          setTotalPages(0);
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [scope]
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || page >= totalPages || !activeSearchTerm) {
      return;
    }

    const nextPage = page + 1;
    const categoryId = scope === 'kids' ? KIDS_CATEGORY_ID : undefined;
    const requestId = searchRequestIdRef.current;

    setLoadingMore(true);
    try {
      const response = await searchPodcastsPaginated({
        query: activeSearchTerm,
        page: nextPage,
        perPage: 10,
        categoryId,
      });

      if (requestId === searchRequestIdRef.current) {
        setResults((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = response.podcasts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
      }
    } catch (e) {
      console.warn('Error loading more search results:', e);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [loading, loadingMore, page, totalPages, activeSearchTerm, scope]);

  useEffect(() => {
    if (localParams.q) {
      setQuery(localParams.q);
      performSearch(localParams.q);
    }
  }, [localParams.q, performSearch]);

  const handleClear = () => {
    setQuery('');
    setActiveSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setLoading(false);
    setLoadingMore(false);
    setPage(1);
    setTotalPages(1);
    setTotalResults(0);
  };

  const handleScopeChange = (newScope: SearchScope) => {
    setScope(newScope);
    if (activeSearchTerm) {
      performSearch(activeSearchTerm, newScope);
    }
  };

  const handleTopicTap = (topicQuery: string) => {
    setQuery(topicQuery);
    performSearch(topicQuery);
  };

  const displayedResults =
    sortBy === 'rating'
      ? sortPodcasts(results, 'rating')
      : sortBy === 'date'
      ? sortPodcasts(results, 'date')
      : sortBy === 'name'
      ? sortPodcasts(results, 'name')
      : results;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Search Input Bar */}
      <View style={styles.searchHeader}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: isKidsMode ? theme.colors.primaryLight : theme.colors.border,
              borderRadius: isKidsMode ? 20 : 12,
            },
          ]}
        >
          {/* Clickable Search Icon Button */}
          <TouchableOpacity
            onPress={() => performSearch(query)}
            style={styles.searchIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color={theme.colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={isKidsMode ? 'חפשו פודקאסט, סיפור או נושא...' : 'חיפוש בכל הפודקאסטים...'}
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            textAlign="right"
            autoCorrect={false}
          />

          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Scope Filter: All Podcasts vs Kid-friendly */}
        <View style={styles.scopeRow}>
          <TouchableOpacity
            onPress={() => handleScopeChange('all')}
            style={[
              styles.scopeChip,
              {
                backgroundColor: scope === 'all' ? theme.colors.primary : theme.colors.card,
                borderColor: scope === 'all' ? theme.colors.primary : theme.colors.border,
                borderRadius: isKidsMode ? 16 : 10,
              },
            ]}
          >
            <Text
              style={[
                styles.scopeChipText,
                { color: scope === 'all' ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              🌐 כל הפודקאסטים
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleScopeChange('kids')}
            style={[
              styles.scopeChip,
              {
                backgroundColor: scope === 'kids' ? theme.colors.primary : theme.colors.card,
                borderColor: scope === 'kids' ? theme.colors.primary : theme.colors.border,
                borderRadius: isKidsMode ? 16 : 10,
              },
            ]}
          >
            <Text
              style={[
                styles.scopeChipText,
                { color: scope === 'kids' ? '#FFFFFF' : theme.colors.text },
              ]}
            >
              🧸 מתאים לילדים
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggested Topics (When no search has been performed) */}
      {!hasSearched && query.length === 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.suggestionsContainer,
            { paddingBottom: currentEpisode ? 90 : 24 },
          ]}
        >
          <Text style={[styles.suggestionsTitle, { color: theme.colors.text }]}>
            {isKidsMode ? '🎯 נושאים אהובים לחיפוש' : 'נושאים פופולריים'}
          </Text>

          <View style={styles.topicsGrid}>
            {KIDS_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                onPress={() => handleTopicTap(topic.query)}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    borderRadius: isKidsMode ? 18 : 12,
                  },
                ]}
              >
                <Text style={styles.topicCardEmoji}>{topic.emoji}</Text>
                <Text style={[styles.topicCardTitle, { color: theme.colors.text }]}>
                  {topic.title}
                </Text>
                <Text style={[styles.topicCardSub, { color: theme.colors.textSecondary }]}>
                  {topic.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {/* Initial Search Loading Indicator */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            מחפש ב-podcastim.org.il...
          </Text>
        </View>
      ) : null}

      {/* Search Results List with Infinite Scroll (Lazy Loading) */}
      {!loading && hasSearched && results.length > 0 ? (
        <FlatList
          data={displayedResults}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: currentEpisode ? 90 : 24 },
          ]}
          renderItem={({ item }) => <PodcastCard podcast={item} horizontal />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <View style={styles.resultsCountRow}>
                <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
                  נמצאו {totalResults > 0 ? totalResults : results.length} תוצאות עבור &quot;{activeSearchTerm}&quot;
                </Text>
                {totalPages > 1 && (
                  <Text style={[styles.pagesIndicator, { color: theme.colors.textMuted }]}>
                    (עמוד {page} מתוך {totalPages})
                  </Text>
                )}
              </View>

              {/* Search Sort Bar */}
              <View style={styles.sortBar}>
                <Text style={[styles.sortLabel, { color: theme.colors.textSecondary }]}>מיון:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sortOptionsRow}
                >
                  <TouchableOpacity
                    onPress={() => setSortBy('relevance')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'relevance' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'relevance' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKidsMode ? 16 : 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortPillText,
                        { color: sortBy === 'relevance' ? '#FFFFFF' : theme.colors.text },
                      ]}
                    >
                      🎯 התאמה
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy('rating')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'rating' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'rating' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKidsMode ? 16 : 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortPillText,
                        { color: sortBy === 'rating' ? '#FFFFFF' : theme.colors.text },
                      ]}
                    >
                      ⭐ דירוג
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy('date')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'date' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'date' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKidsMode ? 16 : 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortPillText,
                        { color: sortBy === 'date' ? '#FFFFFF' : theme.colors.text },
                      ]}
                    >
                      🕒 תאריך
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortBy('name')}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sortBy === 'name' ? theme.colors.primary : theme.colors.card,
                        borderColor: sortBy === 'name' ? theme.colors.primary : theme.colors.border,
                        borderRadius: isKidsMode ? 16 : 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortPillText,
                        { color: sortBy === 'name' ? '#FFFFFF' : theme.colors.text },
                      ]}
                    >
                      🔤 שם
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  טוען 10 תוצאות נוספות...
                </Text>
              </View>
            ) : page >= totalPages && results.length > 5 ? (
              <View style={styles.footerEnd}>
                <Text style={[styles.footerEndText, { color: theme.colors.textMuted }]}>
                  נמצאו כל {totalResults} התוצאות 🎉
                </Text>
              </View>
            ) : undefined
          }
        />
      ) : null}

      {/* No Results Empty State */}
      {!loading && hasSearched && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            לא נמצאו תוצאות עבור &quot;{activeSearchTerm}&quot;
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {scope === 'kids'
              ? 'לא נמצאו פודקאסטים מתאימים לילדים עבור חיפוש זה.'
              : 'נסו לבדוק שגיאות כתיב או לחפש מילה כללית יותר.'}
          </Text>

          {scope === 'kids' && (
            <TouchableOpacity
              onPress={() => handleScopeChange('all')}
              style={[styles.switchScopeBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
              <Text style={styles.switchScopeBtnText}>חפש בכל הפודקאסטים באתר</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchIconBtn: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'left',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '48%',
    padding: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  topicCardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  topicCardSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
    textAlign: 'left',
  },
  pagesIndicator: {
    fontSize: 12,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
  footerEnd: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerEndText: {
    fontSize: 12,
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  switchScopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  switchScopeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

