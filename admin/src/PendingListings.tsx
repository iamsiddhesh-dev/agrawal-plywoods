import { useCallback, useEffect, useState } from 'react';
import { fetchPendingListings, setListingStatus, updateListing } from './lib/api';
import ListingForm from './ListingForm';
import Modal from './Modal';
import type { NewListingInput, PendingListing } from './types';

interface PendingListingsProps {
  pin: string;
}

export default function PendingListings({ pin }: PendingListingsProps) {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setListings(await fetchPendingListings(pin));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    try {
      await setListingStatus(pin, id, status);
      setListings((prev) => prev.filter((l) => l.id !== id));
      if (openId === id) setOpenId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSave(id: string, input: NewListingInput) {
    await updateListing(pin, id, input);
    await load();
  }

  const openListing = listings.find((l) => l.id === openId) ?? null;

  return (
    <div>
      <div className="tab-header">
        <h2>Pending Listings</h2>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && listings.length === 0 && <p className="empty">No pending listings.</p>}
      <div className="card-list">
        {listings.map((listing) => (
          <div
            className="card card-clickable"
            key={listing.id}
            onClick={() => setOpenId(listing.id)}
            role="button"
            tabIndex={0}
          >
            {listing.photo_url ? (
              <img src={listing.photo_url} alt={listing.name} className="thumb" />
            ) : (
              <div className="thumb thumb-placeholder">No photo</div>
            )}
            <div className="card-body">
              <h3 className="clamp-2">{listing.name}</h3>
              <p>₹{listing.price_per_unit} / {listing.unit} &middot; Qty: {listing.quantity_available}</p>
              <span className="expand-hint">View full details ›</span>
            </div>
          </div>
        ))}
      </div>

      {openListing && (
        <Modal title={openListing.name} onClose={() => setOpenId(null)}>
          {openListing.photo_url ? (
            <img src={openListing.photo_url} alt={openListing.name} className="detail-image" />
          ) : (
            <div className="detail-image detail-image-placeholder">No photo</div>
          )}

          <div className="detail-section">
            <h4>Seller Info</h4>
            <p>Name: <span className="contact-highlight">{openListing.seller_name}</span></p>
            <p>Phone: <span className="contact-highlight">{openListing.seller_phone}</span></p>
            {openListing.seller_email ? (
              <p>Email: <span className="contact-highlight">{openListing.seller_email}</span></p>
            ) : null}
          </div>

          {openListing.notes && (
            <div className="detail-section">
              <h4>Notes</h4>
              <p>{openListing.notes}</p>
            </div>
          )}

          <div className="detail-section">
            <h4>Edit before approving</h4>
            <ListingForm
              submitLabel="Save Changes"
              initial={{
                name: openListing.name,
                price: openListing.price_per_unit,
                unit: openListing.unit,
                quantity: openListing.quantity_available,
                notes: openListing.notes ?? '',
                photoUrl: openListing.photo_url ?? '',
                sellerName: openListing.seller_name,
                sellerPhone: openListing.seller_phone,
                sellerEmail: openListing.seller_email ?? '',
              }}
              onSubmit={(input) => handleSave(openListing.id, input)}
            />
          </div>

          <div className="actions">
            <button
              className="btn btn-approve"
              disabled={busyId === openListing.id}
              onClick={() => handleAction(openListing.id, 'approved')}
            >
              Approve
            </button>
            <button
              className="btn btn-reject"
              disabled={busyId === openListing.id}
              onClick={() => handleAction(openListing.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
