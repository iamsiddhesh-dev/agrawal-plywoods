import React from 'react';
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
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(n, Math.max(max, 1)));

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, value <= 1 && styles.btnDisabled]}
        onPress={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
      >
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={String(value)}
        keyboardType="number-pad"
        onChangeText={(text) => {
          const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
          if (Number.isNaN(n)) return onChange(1);
          onChange(clamp(n));
        }}
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
