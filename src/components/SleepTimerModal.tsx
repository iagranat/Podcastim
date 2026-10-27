import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useApp } from '../context/AppContext';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ visible, onClose }) => {
  const { setSleepTimer, cancelSleepTimer, sleepTimerOption } = useAudioPlayer();
  const { theme, mode } = useApp();
  const isKids = mode === 'kids';

  const options = [
    { label: '15 דקות', minutes: 15, icon: 'time-outline' },
    { label: '30 דקות', minutes: 30, icon: 'bed-outline' },
    { label: '45 דקות', minutes: 45, icon: 'moon-outline' },
    { label: '60 דקות', minutes: 60, icon: 'planet-outline' },
    { label: 'בסיום הפרק הנוכחי', minutes: 0, icon: 'checkmark-circle-outline' },
  ];

  const handleSelect = (minutes: number) => {
    setSleepTimer(minutes);
    onClose();
  };

  const handleCancel = () => {
    cancelSleepTimer();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.card,
                  borderRadius: isKids ? 28 : 20,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isKids ? theme.colors.primaryLight : theme.colors.card },
                  ]}
                >
                  <Ionicons
                    name="moon"
                    size={28}
                    color={isKids ? theme.colors.primary : theme.colors.accent}
                  />
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  טיימר שינה
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  השמעת הפודקאסט תיפסק אוטומטית כשתרדמו
                </Text>
              </View>

              {/* Options */}
              <View style={styles.optionsList}>
                {options.map((opt) => {
                  const isSelected = sleepTimerOption === opt.minutes;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => handleSelect(opt.minutes)}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? isKids
                              ? theme.colors.primaryLight
                              : theme.colors.primary
                            : 'transparent',
                          borderRadius: isKids ? 16 : 12,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={22}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected
                              ? isKids
                                ? theme.colors.primary
                                : '#FFFFFF'
                              : theme.colors.text,
                            fontWeight: isSelected ? 'bold' : 'normal',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={isKids ? theme.colors.primary : '#FFFFFF'}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {sleepTimerOption !== null && (
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={[styles.cancelTimerButton, { borderColor: theme.colors.secondary }]}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={theme.colors.secondary} />
                    <Text style={[styles.cancelTimerText, { color: theme.colors.secondary }]}>
                      בטל טיימר פעיל
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isKids ? theme.colors.background : theme.colors.border,
                    borderRadius: isKids ? 20 : 14,
                  },
                ]}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>סגור</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  optionsList: {
    gap: 8,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    textAlign: 'left',
  },
  cancelTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  cancelTimerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
