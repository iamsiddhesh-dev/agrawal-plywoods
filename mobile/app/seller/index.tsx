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
import { createListing, uploadListingPhoto } from '../../src/lib/api';

const UNITS = ['sheet', 'sq ft', 'piece'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  unitChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  unitChipText: {
    color: '#555',
    fontWeight: '600',
  },
  unitChipTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 14,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    if (!sellerName.trim()) return setError('Your name is required.');
    if (!sellerPhone.trim()) return setError('Your phone number is required.');

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoBase64) {
        photoUrl = await uploadListingPhoto(photoBase64);
      }

      await createListing({
        name: name.trim(),
        pricePerUnit: price,
        unit,
        quantityAvailable: qty,
        notes: notes.trim(),
        photoUrl,
        sellerName: sellerName.trim(),
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Listing</Text>

          <Text style={styles.label}>Product name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 18mm Marine Ply 8x4"
            value={name}
            onChangeText={setName}
            editable={!submitting}
          />

          <Text style={styles.label}>Price per unit (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
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
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional details"
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!submitting}
          />

          <Text style={styles.label}>Photo (optional)</Text>
          <PhotoPicker
            onPhotoSelected={(base64) => setPhotoBase64(base64)}
            disabled={submitting}
          />

          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="Seller name"
            value={sellerName}
            onChangeText={setSellerName}
            editable={!submitting}
          />

          <Text style={styles.label}>Your phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            value={sellerPhone}
            onChangeText={setSellerPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />

          <Text style={styles.label}>Your email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Listing</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
