import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { createContactRequest, checkContactRequest } from '../../src/lib/api';
import type { PublicListing } from '../../src/types';

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
  errorText: {
    fontSize: 15,
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
  },
  body: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  price: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '700',
    marginTop: 6,
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    color: '#444',
    marginTop: 12,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  contactBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  contactText: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
  },
  pendingText: {
    fontSize: 15,
    color: '#e67e22',
    fontWeight: '600',
  },
  requestButton: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  formError: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 8,
  },
});

type RequestState =
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'approved'; seller_name?: string; seller_phone?: string; seller_email?: string }
  | { status: 'rejected' };

export default function ListingDetail() {
  const params = useLocalSearchParams<{ listingId: string; listing?: string }>();
  const listingId = params.listingId;

  const [listing, setListing] = useState<PublicListing | null>(
    params.listing ? (JSON.parse(params.listing) as PublicListing) : null
  );
  const [loadingListing, setLoadingListing] = useState(!params.listing);
  const [listingError, setListingError] = useState<string | null>(null);

  const [requestState, setRequestState] = useState<RequestState>({ status: 'none' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `contact_request:${listingId}`;

  const loadListing = React.useCallback(async () => {
    if (!listingId) return;
    setLoadingListing(true);
    setListingError(null);
    try {
      const { data, error } = await supabase
        .from('public_listings')
        .select('*')
        .eq('id', listingId)
        .single();
      if (error) throw error;
      setListing(data as PublicListing);
    } catch (e) {
      setListingError(e instanceof Error ? e.message : 'Failed to load listing');
    } finally {
      setLoadingListing(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (listing || !listingId) return;
    loadListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setCheckingRequest(true);
      try {
        const storedId = await AsyncStorage.getItem(storageKey);
        if (!storedId) {
          setRequestState({ status: 'none' });
          return;
        }
        setRequestId(storedId);
        const result = await checkContactRequest(storedId);
        if (result.request_status === 'approved') {
          setRequestState({
            status: 'approved',
            seller_name: result.seller_name,
            seller_phone: result.seller_phone,
            seller_email: result.seller_email,
          });
        } else if (result.request_status === 'pending') {
          setRequestState({ status: 'pending' });
        } else {
          setRequestState({ status: 'rejected' });
        }
      } catch {
        setRequestState({ status: 'none' });
      } finally {
        setCheckingRequest(false);
      }
    })();
  }, [listingId, storageKey]);

  const handleSubmitRequest = async () => {
    setFormError(null);
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setFormError('Name and phone are both required.');
      return;
    }
    if (!listingId) return;

    setSubmitting(true);
    try {
      const newId = await createContactRequest(listingId, buyerName.trim(), buyerPhone.trim());
      await AsyncStorage.setItem(storageKey, newId);
      setRequestId(newId);
      setRequestState({ status: 'pending' });
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingListing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  if (listingError || !listing) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{listingError ?? 'Listing not found'}</Text>
        {listingError ? (
          <TouchableOpacity style={styles.requestButton} onPress={loadListing}>
            <Text style={styles.requestButtonText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView>
          {listing.photo_url ? (
            <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No photo</Text>
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{listing.name}</Text>
            <Text style={styles.price}>
              ₹{listing.price_per_unit} / {listing.unit}
            </Text>
            <Text style={styles.meta}>Available: {listing.quantity_available} {listing.unit}</Text>
            <Text style={styles.meta}>Seller: {listing.seller_name}</Text>
            {listing.notes ? <Text style={styles.notes}>{listing.notes}</Text> : null}

            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactBox}>
              {checkingRequest ? (
                <ActivityIndicator color="#4CAF50" />
              ) : requestState.status === 'approved' ? (
                <>
                  <Text style={styles.contactText}>Name: {requestState.seller_name}</Text>
                  <Text style={styles.contactText}>Phone: {requestState.seller_phone}</Text>
                  {requestState.seller_email ? (
                    <Text style={styles.contactText}>Email: {requestState.seller_email}</Text>
                  ) : null}
                </>
              ) : requestState.status === 'pending' ? (
                <Text style={styles.pendingText}>Request pending approval</Text>
              ) : (
                <>
                  <Text style={styles.contactText}>Phone: {listing.seller_phone_masked}</Text>
                  {listing.seller_email_masked ? (
                    <Text style={styles.contactText}>Email: {listing.seller_email_masked}</Text>
                  ) : null}

                  {showForm ? (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        value={buyerName}
                        onChangeText={setBuyerName}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Your phone number"
                        value={buyerPhone}
                        onChangeText={setBuyerPhone}
                        keyboardType="phone-pad"
                      />
                      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
                      <TouchableOpacity
                        style={[styles.requestButton, submitting && styles.requestButtonDisabled]}
                        onPress={handleSubmitRequest}
                        disabled={submitting}
                      >
                        <Text style={styles.requestButtonText}>
                          {submitting ? 'Submitting…' : 'Submit Request'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.requestButton} onPress={() => setShowForm(true)}>
                      <Text style={styles.requestButtonText}>Request Contact</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
