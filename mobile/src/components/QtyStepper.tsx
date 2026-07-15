import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radii } from '../theme';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.gold,
  },
  input: {
    width: 64,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.black,
  },
});

export default function QtyStepper({
  value,
  max,
  min = 0,
  onChange,
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));

  // Only resync from the parent when it's not the value we just typed —
  // otherwise every keystroke would be fought back to the previous number.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) => Math.max(min, Math.min(n, Math.max(max, min)));

  const handleChangeText = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits === '') {
      // Let the field sit empty while the user is mid-edit (e.g. clearing
      // "1" to type "9") instead of snapping back and blocking the edit.
      setText('');
      return;
    }
    const clamped = clamp(parseInt(digits, 10));
    setText(String(clamped));
    onChange(clamped);
  };

  const handleBlur = () => {
    if (text === '') {
      setText(String(min));
      onChange(min);
    }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, value <= min && styles.btnDisabled]}
        onPress={() => onChange(clamp(value - 1))}
        disabled={value <= min}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={text}
        keyboardType="number-pad"
        onChangeText={handleChangeText}
        onBlur={handleBlur}
      />

      <TouchableOpacity
        style={[styles.btn, value >= max && styles.btnDisabled]}
        onPress={() => onChange(clamp(value + 1))}
        disabled={value >= max}
      >
        <Text style={styles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
