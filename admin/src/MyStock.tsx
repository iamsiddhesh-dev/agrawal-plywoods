import { useCallback, useEffect, useState } from 'react';
import { addListing, deleteListing, fetchAllListings, updateListing } from './lib/api';
import ListingForm from './ListingForm';
import type { AdminListing, NewListingInput } from './types';

interface MyStockProps {
  pin: string;
}

export default function MyStock({ pin }: MyStockProps) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  async function handleAdd(input: NewListingInput) {
    await addListing(pin, input);
    setShowAddForm(false);
    load();
  }

  async function handleEdit(id: string, input: NewListingInput) {
    await updateListing(pin, id, input);
    setEditingId(null);
    load();
  }

  return (
    <div>
      <div className="tab-header">
        <h2>My Stock</h2>
        <button onClick={() => { setShowAddForm((v) => !v); setEditingId(null); }}>
          {showAddForm ? 'Cancel' : '+ Add Listing'}
        </button>
      </div>

      {showAddForm && (
        <ListingForm submitLabel="Add to Stock" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      {error && <p className="error">{error}</p>}
      {!loading && listings.length === 0 && <p className="empty">No listings yet.</p>}
      <div className="card-list">
        {listings.map((listing) => (
          <div className="card-block" key={listing.id}>
            <div className="card">
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
                    onClick={() => { setEditingId(editingId === listing.id ? null : listing.id); setShowAddForm(false); }}
                  >
                    {editingId === listing.id ? 'Close' : 'Edit'}
                  </button>
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
            {editingId === listing.id && (
              <ListingForm
                submitLabel="Save Changes"
                onCancel={() => setEditingId(null)}
                initial={{
                  name: listing.name,
                  price: listing.price_per_unit,
                  unit: listing.unit,
                  quantity: listing.quantity_available,
                  notes: listing.notes ?? '',
                  photoUrl: listing.photo_url ?? '',
                  sellerName: listing.seller_name,
                  sellerPhone: listing.seller_phone,
                  sellerEmail: listing.seller_email ?? '',
                }}
                onSubmit={(input) => handleEdit(listing.id, input)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
