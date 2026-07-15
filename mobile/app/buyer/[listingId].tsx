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
  Modal,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { createContactRequest, checkContactRequest } from '../../src/lib/api';
import { useCart } from '../../src/lib/cartStore';
import QtyStepper from '../../src/components/QtyStepper';
import Navbar from '../../src/components/Navbar';
import type { PublicListing } from '../../src/types';
import { colors, fonts, radii, spacing } from '../../src/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: colors.ivoryDark,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: colors.ivoryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: colors.muted,
    fontFamily: fonts.body,
  },
  body: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.black,
    textAlign: 'center',
  },
  price: {
    fontSize: 19,
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    marginTop: 6,
  },
  meta: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  notes: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.black,
    marginTop: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  stepperWrap: {
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  stepperLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  stockMsg: {
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  addToCartBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    width: '100%',
  },
  addToCartText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.headingMedium,
    color: colors.black,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  contactBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.lg,
    width: '100%',
  },
  contactText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.black,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
  },
  requestButton: {
    marginTop: 12,
    backgroundColor: colors.black,
    paddingVertical: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.body,
    marginTop: 10,
    backgroundColor: colors.white,
    color: colors.black,
  },
  formError: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 8,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageModalCloseText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.bodyBold,
  },
  imageModalImage: {
    width: '100%',
    height: '80%',
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
  const { addToCart } = useCart();

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

  const [cartQty, setCartQty] = useState(1);
  const [stockMsg, setStockMsg] = useState<string | null>(null);
  const [addedLabel, setAddedLabel] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

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

  const handleQtyChange = (next: number) => {
    if (!listing) return;
    setStockMsg(next >= listing.quantity_available ? `Only ${listing.quantity_available} available` : null);
    setCartQty(next);
  };

  const handleAddToCart = () => {
    if (!listing) return;
    if (cartQty <= 0) {
      setStockMsg("No quantity selected — this can't be added to the cart");
      return;
    }
    addToCart(
      {
        listingId: listing.id,
        name: listing.name,
        pricePerUnit: listing.price_per_unit,
        unit: listing.unit,
        photoUrl: listing.photo_url,
        quantityAvailable: listing.quantity_available,
      },
      cartQty
    );
    setAddedLabel(true);
    setTimeout(() => setAddedLabel(false), 1500);
  };

  if (loadingListing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Navbar role="buyer" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (listingError || !listing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Navbar role="buyer" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{listingError ?? 'Listing not found'}</Text>
          {listingError ? (
            <TouchableOpacity style={styles.requestButton} onPress={loadListing}>
              <Text style={styles.requestButtonText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Navbar role="buyer" showBack />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={listing.photo_url ? 0.85 : 1}
            onPress={() => listing.photo_url && setImageModalVisible(true)}
          >
            {listing.photo_url ? (
              <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.body}>
            <Text style={styles.name}>{listing.name}</Text>
            <Text style={styles.price}>
              ₹{listing.price_per_unit} / {listing.unit}
            </Text>
            <Text style={styles.meta}>Available: {listing.quantity_available} {listing.unit}</Text>
            {listing.notes ? <Text style={styles.notes}>{listing.notes}</Text> : null}

            <View style={styles.stepperWrap}>
              <Text style={styles.stepperLabel}>Quantity</Text>
              <QtyStepper value={cartQty} max={listing.quantity_available} onChange={handleQtyChange} />
              {stockMsg ? <Text style={styles.stockMsg}>{stockMsg}</Text> : null}

              <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>{addedLabel ? 'Added ✓' : 'Add to Cart'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactBox}>
              <Text style={styles.contactText}>Name: {listing.seller_name}</Text>
              {checkingRequest ? (
                <ActivityIndicator color={colors.gold} />
              ) : requestState.status === 'approved' ? (
                <>
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
                        placeholderTextColor={colors.muted}
                        value={buyerName}
                        onChangeText={setBuyerName}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Your phone number"
                        placeholderTextColor={colors.muted}
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

      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalBackdrop}>
          <TouchableOpacity
            style={styles.imageModalCloseBtn}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {listing.photo_url ? (
            <Image source={{ uri: listing.photo_url }} style={styles.imageModalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
