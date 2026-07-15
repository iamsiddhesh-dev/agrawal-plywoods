import { useCallback, useEffect, useState } from 'react';
import { addListing, deleteListing, fetchAllListings, uploadListingPhoto } from './lib/api';
import type { AdminListing } from './types';

const UNITS = ['sheet', 'sq ft', 'piece'];

interface MyStockProps {
  pin: string;
}

export default function MyStock({ pin }: MyStockProps) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('sheet');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setListings(await fetchAllListings(pin));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteListing(pin, id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  function resetForm() {
    setName('');
    setPrice('');
    setUnit('sheet');
    setQuantity('');
    setNotes('');
    setSellerName('');
    setSellerPhone('');
    setSellerEmail('');
    setPhotoFile(null);
    setFormError('');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const priceNum = Number(price);
    const qtyNum = Number(quantity);

    if (!name.trim()) return setFormError('Product name is required.');
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) return setFormError('Enter a valid price.');
    if (!quantity.trim() || !Number.isInteger(qtyNum) || qtyNum < 0) return setFormError('Enter a valid quantity.');
    if (!sellerName.trim()) return setFormError('Seller name is required.');
    if (!sellerPhone.trim()) return setFormError('Seller phone is required.');

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadListingPhoto(photoFile);
      }
      await addListing(pin, {
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
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="tab-header">
        <h2>My Stock</h2>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Listing'}
        </button>
      </div>

      {showForm && (
        <form className="stock-form" onSubmit={handleAdd}>
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
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
          <div className="stock-form-row">
            <input placeholder="Seller name" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
            <input placeholder="Seller phone" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} />
          </div>
          <input placeholder="Seller email (optional)" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} />
          {formError && <p className="error">{formError}</p>}
          <button className="approve" type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add to Stock'}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
      {!loading && listings.length === 0 && <p className="empty">No listings yet.</p>}
      <div className="card-list">
        {listings.map((listing) => (
          <div className="card" key={listing.id}>
            {listing.photo_url ? (
              <img src={listing.photo_url} alt={listing.name} className="thumb" />
            ) : (
              <div className="thumb thumb-placeholder">No photo</div>
            )}
            <div className="card-body">
              <h3 className="clamp-2">{listing.name}</h3>
              <p>
                ₹{listing.price_per_unit} / {listing.unit} &middot; Qty: {listing.quantity_available}
                {' · '}
                <span className={`status-badge status-${listing.status}`}>{listing.status}</span>
              </p>
              <div className="actions">
                <button
                  className="reject"
                  disabled={busyId === listing.id}
                  onClick={() => handleDelete(listing.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
