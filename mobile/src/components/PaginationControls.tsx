import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  button: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#eee',
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#fff',
  },
});

interface Props {
  currentPage: number; // 0-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({ currentPage, totalPages, onPageChange }: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, currentPage === 0 && styles.buttonDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <Text style={styles.buttonText}>Prev</Text>
      </TouchableOpacity>

      {pages.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.button, p === currentPage && styles.buttonActive]}
          onPress={() => onPageChange(p)}
        >
          <Text style={[styles.buttonText, p === currentPage && styles.buttonTextActive]}>
            {p + 1}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, currentPage === totalPages - 1 && styles.buttonDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}
