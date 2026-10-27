import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { PodcastCard } from '../../components/PodcastCard';
import { EpisodeItem } from '../../components/EpisodeItem';

export default function FavoritesScreen() {
  const { theme, mode, favorites, history } = useApp();
  const { playEpisode } = useAudioPlayer();
  const isKids = mode === 'kids';

  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
          {isKids ? 'האהובים שלי ⭐' : 'מועדפים והיסטוריה'}
        </Text>

        {/* Tab switch */}
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: isKids ? 18 : 12,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            style={[
              styles.segmentBtn,
              activeTab === 'favorites' && [
                styles.activeSegmentBtn,
                { backgroundColor: isKids ? theme.colors.primary : theme.colors.primary },
              ],
            ]}
          >
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'favorites' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'favorites' ? '#FFFFFF' : theme.colors.textSecondary,
                  fontWeight: activeTab === 'favorites' ? 'bold' : 'normal',
                },
              ]}
            >
              פודקאסטים ({favorites.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[
              styles.segmentBtn,
              activeTab === 'history' && [
                styles.activeSegmentBtn,
                { backgroundColor: isKids ? theme.colors.primary : theme.colors.primary },
              ],
            ]}
          >
            <Ionicons
              name="time"
              size={16}
              color={activeTab === 'history' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'history' ? '#FFFFFF' : theme.colors.textSecondary,
                  fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                },
              ]}
            >
              היסטוריה ({history.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'favorites' ? (
        favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <PodcastCard podcast={item} horizontal />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💖</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {isKids ? 'עדיין אין פודקאסטים אהובים' : 'רשימת המועדפים ריקה'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {isKids
                ? 'לחצו על הלב ❤️ בכל פודקאסט שתרצו לשמור כאן'
                : 'סמנו פודקאסטים עם כפתור הלב כדי למצוא אותם במהירות'}
            </Text>
          </View>
        )
      ) : history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <EpisodeItem episode={item} playlist={history} index={index} />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎧</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            טרם האזנתם לפרקים
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            כל פרק שתשמעו יישמר כאן כדי שתוכלו לחזור אליו בכל עת
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'left',
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  activeSegmentBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
