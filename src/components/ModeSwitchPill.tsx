import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { ParentGateModal } from './ParentGateModal';

export const ModeSwitchPill: React.FC = () => {
  const { mode, setMode, theme, parentLockEnabled } = useApp();
  const [gateVisible, setGateVisible] = useState(false);
  const isKids = mode === 'kids';

  const handlePress = () => {
    if (isKids) {
      if (parentLockEnabled) {
        setGateVisible(true);
      } else {
        setMode('full');
      }
    } else {
      // Switching back to kids is always instant and free
      setMode('kids');
    }
  };

  const onGateSuccess = () => {
    setGateVisible(false);
    setMode('full');
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: isKids ? theme.colors.card : theme.colors.primaryLight,
            borderColor: isKids ? theme.colors.primaryLight : theme.colors.primary,
          },
        ]}
      >
        <Ionicons
          name={isKids ? 'happy' : 'apps'}
          size={18}
          color={isKids ? theme.colors.primary : theme.colors.secondary}
        />
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {isKids ? 'מצב ילדים פעיל' : 'כל הפודקאסטים'}
        </Text>
        <View style={[styles.arrowPill, { backgroundColor: isKids ? theme.colors.primaryLight : theme.colors.card }]}>
          <Ionicons
            name="swap-horizontal"
            size={14}
            color={isKids ? theme.colors.primary : theme.colors.secondary}
          />
        </View>
      </TouchableOpacity>

      <ParentGateModal
        visible={gateVisible}
        onSuccess={onGateSuccess}
        onCancel={() => setGateVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  arrowPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
