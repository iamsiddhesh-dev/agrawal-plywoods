import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchListings } from '../../src/lib/api';
import type { PublicListing } from '../../src/types';
import ListingCard from '../../src/components/ListingCard';
import { colors, fonts, radii, spacing } from '../../src/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    backgroundColor: colors.white,
    color: colors.black,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
  },
  list: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});

export default function BuyerSearch() {
  const [term, setTerm] = useState('');
  const [rows, setRows] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { rows: results } = await fetchListings(0, value);
      setRows(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(term), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term, runSearch]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Search products..."
          placeholderTextColor={colors.muted}
          value={term}
          onChangeText={setTerm}
          autoFocus
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {term.trim() ? 'No matching products' : 'Start typing to search'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          key="2-col"
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}
    </SafeAreaView>
  );
}
