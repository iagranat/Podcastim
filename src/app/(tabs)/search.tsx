import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { PodcastCard } from '../../components/PodcastCard';
import { fetchPodcasts, searchPodcastsFast, getOrLoadCatalogIndex, KIDS_CATEGORY_ID } from '../../api/podcastim';
import { Podcast } from '../../api/types';
import { KIDS_TOPICS } from '../../constants/kidsTopics';

export default function SearchScreen() {
  const { theme, mode } = useApp();
  const isKids = mode === 'kids';
  const localParams = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(localParams.q || '');
  const [results, setResults] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Preload local catalog index on screen mount for 0ms instant search
  useEffect(() => {
    getOrLoadCatalogIndex().catch(() => {});
  }, []);

  const performSearch = useCallback(
    async (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setHasSearched(true);

      // 1. Instant local search (0ms latency from cached catalog index)
      const instantResults = await searchPodcastsFast({
        query: trimmed,
        isKids,
      });
      setResults(instantResults);

      // 2. If results are few or user is searching more specific terms, query remote API in background
      if (instantResults.length < 10) {
        setLoading(true);
        try {
          const catId = isKids ? KIDS_CATEGORY_ID : undefined;
          const remoteData = await fetchPodcasts({
            search: trimmed,
            categoryId: catId,
            perPage: 20,
          });

          if (remoteData.length > 0) {
            // Merge remote items without duplicates
            setResults((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const fresh = remoteData.filter((p) => !existingIds.has(p.id));
              return [...prev, ...fresh];
            });
          }
        } catch (e) {
          console.warn('Remote search error', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    },
    [isKids]
  );

  useEffect(() => {
    if (localParams.q) {
      setQuery(localParams.q);
      performSearch(localParams.q);
    }
  }, [localParams.q, performSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleTopicTap = (topicQuery: string) => {
    setQuery(topicQuery);
    performSearch(topicQuery);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Search Input Bar */}
      <View style={styles.searchHeader}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: isKids ? theme.colors.primaryLight : theme.colors.border,
              borderRadius: isKids ? 20 : 12,
            },
          ]}
        >
          <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder={isKids ? 'חפשו פודקאסט, סיפור או נושא...' : 'חיפוש בכל הפודקאסטים...'}
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.trim().length > 0) {
                performSearch(text);
              } else {
                handleClear();
              }
            }}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            textAlign="right"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggested Topics (When no search has been performed) */}
      {!hasSearched && query.length === 0 ? (
        <ScrollView contentContainerStyle={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: theme.colors.text }]}>
            {isKids ? '🎯 נושאים אהובים לחיפוש' : 'נושאים פופולריים'}
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
                    borderRadius: isKids ? 18 : 12,
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

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            מחפש פודקאסטים...
          </Text>
        </View>
      ) : null}

      {/* Search Results List */}
      {!loading && hasSearched && results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <PodcastCard podcast={item} horizontal />}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
              נמצאו {results.length} תוצאות עבור &quot;{query}&quot;
            </Text>
          }
        />
      ) : null}

      {/* No Results Empty State */}
      {!loading && hasSearched && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            לא נמצאו תוצאות עבור &quot;{query}&quot;
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            נסו לחפש מילה אחרת או נושא כללי יותר
          </Text>
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
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
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
    paddingBottom: 90,
  },
  resultsCount: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'left',
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
  },
});
