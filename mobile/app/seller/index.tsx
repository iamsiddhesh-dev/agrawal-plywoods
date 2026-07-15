import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhotoPicker from '../../src/components/PhotoPicker';
import Navbar from '../../src/components/Navbar';
import { createListing, uploadListingPhoto } from '../../src/lib/api';
import { colors, fonts, radii, spacing } from '../../src/theme';

const UNITS = ['sheet', 'sq ft', 'piece'];

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollBody: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.muted,
    marginTop: spacing.lg,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.body,
    backgroundColor: colors.white,
    color: colors.black,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  unitChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  unitChipText: {
    color: colors.muted,
    fontFamily: fonts.bodySemiBold,
  },
  unitChipTextSelected: {
    color: colors.white,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 14,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: colors.black,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.black,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 24,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: radii.md,
  },
  doneButtonText: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
});

export default function SellerFlow() {
  const [name, setName] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState('sheet');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    const price = Number(pricePerUnit);
    const qty = Number(quantity);

    if (!name.trim()) return setError('Product name is required.');
    if (!pricePerUnit.trim() || Number.isNaN(price) || price < 0) {
      return setError('Enter a valid price per unit.');
    }
    if (!quantity.trim() || !Number.isInteger(qty) || qty < 0) {
      return setError('Enter a valid whole-number quantity.');
    }
    if (!photoBase64) return setError('A product photo is required.');
    if (!sellerName.trim()) return setError('Your name is required.');
    if (!sellerPhone.trim()) return setError('Your phone number is required.');

    setSubmitting(true);
    try {
      const photoUrl = await uploadListingPhoto(photoBase64);

      await createListing({
        name: toTitleCase(name.trim()),
        pricePerUnit: price,
        unit,
        quantityAvailable: qty,
        notes: notes.trim(),
        photoUrl,
        sellerName: toTitleCase(sellerName.trim()),
        sellerPhone: sellerPhone.trim(),
        sellerEmail: sellerEmail.trim(),
      });

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Submitted for approval.</Text>
          <Text style={styles.successSubtitle}>
            The owner will review your listing before it appears in the buyer catalog.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/role-picker')}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Navbar role="seller" />
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Listing</Text>

          <Text style={styles.label}>Product name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 18mm Marine Ply 8x4"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Price per unit (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            value={pricePerUnit}
            onChangeText={setPricePerUnit}
            keyboardType="decimal-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u && styles.unitChipSelected]}
                onPress={() => setUnit(u)}
                disabled={submitting}
              >
                <Text style={[styles.unitChipText, unit === u && styles.unitChipTextSelected]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Quantity available</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.muted}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional details"
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!submitting}
          />

          <Text style={styles.label}>Photo</Text>
          <PhotoPicker
            onPhotoSelected={(base64) => setPhotoBase64(base64)}
            disabled={submitting}
          />

          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="Seller name"
            placeholderTextColor={colors.muted}
            value={sellerName}
            onChangeText={setSellerName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Your phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor={colors.muted}
            value={sellerPhone}
            onChangeText={setSellerPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Your email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            value={sellerEmail}
            onChangeText={setSellerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!submitting}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Listing</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
