import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface ParentGateModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({ visible, onSuccess, onCancel }) => {
  const { theme } = useApp();
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(8);
  const [options, setOptions] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState(false);

  useEffect(() => {
    if (visible) {
      generateMathQuestion();
      setErrorMsg(false);
    }
  }, [visible]);

  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 8) + 6; // 6 to 13
    const b = Math.floor(Math.random() * 8) + 5; // 5 to 12
    const correct = a * b;

    const fake1 = correct + 2;
    const fake2 = correct - 4;
    const fake3 = correct + 6;

    const allOptions = [correct, fake1, fake2, fake3].sort(() => Math.random() - 0.5);

    setNum1(a);
    setNum2(b);
    setOptions(allOptions);
  };

  const handleSelectAnswer = (ans: number) => {
    if (ans === num1 * num2) {
      setErrorMsg(false);
      onSuccess();
    } else {
      setErrorMsg(true);
      setTimeout(() => {
        generateMathQuestion();
      }, 700);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="lock-closed" size={26} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>אזור הורים בלבד</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              כדי לעבור למצב כל הפודקאסטים או לשנות הגדרות, אנא פתרו את התרגיל הבא:
            </Text>
          </View>

          <View style={styles.questionBox}>
            <Text style={[styles.questionText, { color: theme.colors.primary }]}>
              {num1} × {num2} = ?
            </Text>
          </View>

          {errorMsg && (
            <Text style={styles.errorText}>תשובה שגויה, נסו שוב</Text>
          )}

          <View style={styles.optionsGrid}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSelectAnswer(opt)}
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.optionNumber, { color: theme.colors.text }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
              חזרה לאפליקציה
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
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
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  questionBox: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    width: '47%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
