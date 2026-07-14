import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { fetchListings, PAGE_SIZE } from '../../src/lib/api';
import type { PublicListing } from '../../src/types';
import ListingCard from '../../src/components/ListingCard';
import PaginationControls from '../../src/components/PaginationControls';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 15,
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
});

export default function BuyerFlow() {
  const [rows, setRows] = useState<PublicListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const load = useCallback(async (targetPage: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { rows: newRows, totalCount: newTotal } = await fetchListings(targetPage);
      setRows(newRows);
      setTotalCount(newTotal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(pageRef.current);
    }, [load])
  );

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      load(p);
    },
    [load]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading && rows.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load(page)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No listings yet</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          key="2-col"
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ListingCard listing={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(page, true)} />
          }
          ListFooterComponent={
            totalCount > PAGE_SIZE ? (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
