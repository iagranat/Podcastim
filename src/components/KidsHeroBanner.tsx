import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KIDS_TOPICS, KidsTopic } from '../constants/kidsTopics';

interface KidsHeroBannerProps {
  onSelectTopic?: (topic: KidsTopic) => void;
}

export const KidsHeroBanner: React.FC<KidsHeroBannerProps> = ({ onSelectTopic }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C5CE7', '#8E44AD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.headerRow}>
          <View style={styles.textCol}>
            <Text style={styles.greeting}>שלום חברים! 🎈</Text>
            <Text style={styles.subGreeting}>איזה פודקאסט מרתק נשמע היום?</Text>
          </View>
          <Text style={styles.bigEmoji}>🎧</Text>
        </View>

        {/* Quick topic buttons scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScroll}
        >
          {KIDS_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              activeOpacity={0.8}
              onPress={() => onSelectTopic && onSelectTopic(topic)}
              style={styles.topicChip}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <Text style={styles.topicTitle}>{topic.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  banner: {
    borderRadius: 24,
    padding: 18,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  textCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subGreeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'left',
  },
  bigEmoji: {
    fontSize: 42,
    marginLeft: 8,
  },
  topicsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topicEmoji: {
    fontSize: 16,
  },
  topicTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
