import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { ParentGateModal } from '../../components/ParentGateModal';
import { SleepTimerModal } from '../../components/SleepTimerModal';

export default function SettingsScreen() {
  const { mode, setMode, theme, parentLockEnabled, setParentLockEnabled } = useApp();
  const { sleepTimerOption, cancelSleepTimer, currentEpisode } = useAudioPlayer();

  const [gateVisible, setGateVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const isKids = mode === 'kids';

  const handleToggleMode = () => {
    if (isKids) {
      if (parentLockEnabled) {
        setGateVisible(true);
      } else {
        setMode('full');
      }
    } else {
      setMode('kids');
    }
  };

  const onGateSuccess = () => {
    setGateVisible(false);
    setMode('full');
  };

  const handleOpenWebsite = async () => {
    const url = 'https://podcastim.org.il/';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לפתוח את האתר');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: currentEpisode ? 90 : 24 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
            {isKids ? 'אזור הורים והגדרות ⚙️' : 'הגדרות'}
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
            ניהול מצב צפייה, בקרת הורים וטיימר שינה
          </Text>
        </View>

        {/* Mode Selector Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: isKids ? theme.colors.primaryLight : theme.colors.primary }]}>
              <Ionicons
                name={isKids ? 'happy' : 'apps'}
                size={24}
                color={isKids ? theme.colors.primary : '#FFFFFF'}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {isKids ? 'מצב ילדים (פעיל)' : 'מצב קטלוג מלא (פעיל)'}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                {isKids
                  ? 'ממשק עליז ומותאם לילדים, המציג פודקאסטים וסיפורים בלבד'
                  : 'גישה לכל 70+ הקטגוריות והפודקאסטים באתר'}
              </Text>
            </View>
            <Switch
              value={isKids}
              onValueChange={handleToggleMode}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Parent Lock Option */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondaryLight }]}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.secondary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                נעילת הורים למצב ילדים
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                דורש פתרון תרגיל חשבון כדי לצאת ממצב ילדים
              </Text>
            </View>
            <Switch
              value={parentLockEnabled}
              onValueChange={(val) => setParentLockEnabled(val)}
              trackColor={{ false: '#767577', true: theme.colors.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sleep Timer Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSleepModalVisible(true)}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.accentLight }]}>
              <Ionicons name="moon" size={24} color="#D35400" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                טיימר שינה
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                {sleepTimerOption !== null
                  ? sleepTimerOption === 0
                    ? 'מופעל (בסיום הפרק)'
                    : `מופעל (${sleepTimerOption} דקות)`
                  : 'כבוי'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Site Attribution & External Link */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenWebsite}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.mintLight }]}>
              <Ionicons name="globe-outline" size={24} color={theme.colors.mint} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                אתר podcastim.org.il
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                ביקור באתר הפודקאסטים הישראלי המקורי
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            אפליקציית פודקאסטים בעברית • גרסה 1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            כל התוכן מוגש ישירות ובאופן חי מ-podcastim.org.il
          </Text>
        </View>
      </ScrollView>

      {/* Parent Gate Modal */}
      <ParentGateModal
        visible={gateVisible}
        onSuccess={onGateSuccess}
        onCancel={() => setGateVisible(false)}
      />

      {/* Sleep Timer Picker Modal */}
      <SleepTimerModal
        visible={sleepModalVisible}
        onClose={() => setSleepModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'flex-start',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'left',
    lineHeight: 16,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
