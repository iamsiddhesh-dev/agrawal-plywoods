import { useCallback, useEffect, useState } from 'react';
import { addListing, deleteListing, fetchAllListings, updateListing } from './lib/api';
import ListingForm from './ListingForm';
import Modal from './Modal';
import type { AdminListing, NewListingInput } from './types';

interface MyStockProps {
  pin: string;
}

export default function MyStock({ pin }: MyStockProps) {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(input: NewListingInput) {
    await addListing(pin, input);
    setShowAddModal(false);
    load();
  }

  async function handleEdit(id: string, input: NewListingInput) {
    await updateListing(pin, id, input);
    setEditingId(null);
    load();
  }

  const editingListing = listings.find((l) => l.id === editingId) ?? null;
  const deletingListing = listings.find((l) => l.id === deletingId) ?? null;

  return (
    <div>
      <div className="tab-header">
        <h2>My Stock</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          + Add Listing
        </button>
      </div>

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
                <button className="btn btn-edit btn-sm" onClick={() => setEditingId(listing.id)}>
                  Edit
                </button>
                <button
                  className="btn btn-reject btn-sm"
                  disabled={busyId === listing.id}
                  onClick={() => setDeletingId(listing.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <Modal title="Add Listing" onClose={() => setShowAddModal(false)}>
          <ListingForm submitLabel="Add to Stock" onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
        </Modal>
      )}

      {editingListing && (
        <Modal title={`Edit — ${editingListing.name}`} onClose={() => setEditingId(null)}>
          <ListingForm
            submitLabel="Save Changes"
            onCancel={() => setEditingId(null)}
            initial={{
              name: editingListing.name,
              price: editingListing.price_per_unit,
              unit: editingListing.unit,
              quantity: editingListing.quantity_available,
              notes: editingListing.notes ?? '',
              photoUrl: editingListing.photo_url ?? '',
              sellerName: editingListing.seller_name,
              sellerPhone: editingListing.seller_phone,
              sellerEmail: editingListing.seller_email ?? '',
            }}
            onSubmit={(input) => handleEdit(editingListing.id, input)}
          />
        </Modal>
      )}

      {deletingListing && (
        <Modal title="Delete listing?" onClose={() => setDeletingId(null)}>
          <p className="confirm-message">
            Are you sure you want to delete <strong>{deletingListing.name}</strong>? This will remove it
            entirely, including its price, quantity, and seller info — this can't be undone.
          </p>
          <div className="form-actions">
            <button
              className="btn btn-reject"
              disabled={busyId === deletingListing.id}
              onClick={() => handleDelete(deletingListing.id)}
            >
              {busyId === deletingListing.id ? 'Deleting...' : 'Delete'}
            </button>
            <button className="btn btn-ghost" onClick={() => setDeletingId(null)} disabled={busyId === deletingListing.id}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
