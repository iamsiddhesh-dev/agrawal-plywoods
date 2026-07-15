import { useState } from 'react';
import { uploadListingPhoto } from './lib/api';
import type { NewListingInput } from './types';

const UNITS = ['sheet', 'sq ft', 'piece'];

interface ListingFormProps {
  initial?: Partial<NewListingInput>;
  submitLabel: string;
  onSubmit: (input: NewListingInput) => Promise<void>;
  onCancel?: () => void;
}

export default function ListingForm({ initial, submitLabel, onSubmit, onCancel }: ListingFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [unit, setUnit] = useState(initial?.unit ?? 'sheet');
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [sellerName, setSellerName] = useState(initial?.sellerName ?? '');
  const [sellerPhone, setSellerPhone] = useState(initial?.sellerPhone ?? '');
  const [sellerEmail, setSellerEmail] = useState(initial?.sellerEmail ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(initial?.photoUrl ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = Number(price);
    const qtyNum = Number(quantity);

    if (!name.trim()) return setError('Product name is required.');
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) return setError('Enter a valid price.');
    if (!quantity.trim() || !Number.isInteger(qtyNum) || qtyNum < 0) return setError('Enter a valid quantity.');
    if (!sellerName.trim()) return setError('Seller name is required.');
    if (!sellerPhone.trim()) return setError('Seller phone is required.');

    setSubmitting(true);
    try {
      let photoUrl = existingPhotoUrl;
      if (photoFile) {
        photoUrl = await uploadListingPhoto(photoFile);
      }
      await onSubmit({
        name: name.trim(),
        price: priceNum,
        unit,
        quantity: qtyNum,
        notes: notes.trim(),
        photoUrl,
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellerEmail: sellerEmail.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="stock-form-row">
        <input placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {existingPhotoUrl && !photoFile ? (
        <div className="form-photo-preview">
          <img src={existingPhotoUrl} alt="Current" className="thumb" />
          <span>Current photo — choose a file below to replace it</span>
        </div>
      ) : null}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setPhotoFile(f);
          if (f) setExistingPhotoUrl('');
        }}
      />

      <div className="stock-form-row">
        <input placeholder="Seller name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
        <input placeholder="Seller phone" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
      </div>
      <input placeholder="Seller email (optional)" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} />

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
