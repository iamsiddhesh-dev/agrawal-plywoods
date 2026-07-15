import { useCallback, useEffect, useState } from 'react';
import { fetchPendingListings, setListingStatus, updateListing } from './lib/api';
import ListingForm from './ListingForm';
import type { NewListingInput, PendingListing } from './types';

interface PendingListingsProps {
  pin: string;
}

export default function PendingListings({ pin }: PendingListingsProps) {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSave(id: string, input: NewListingInput) {
    await updateListing(pin, id, input);
    await load();
    setExpandedId(id);
  }

  return (
    <div>
      <div className="tab-header">
        <h2>Pending Listings</h2>
        <button onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && listings.length === 0 && <p className="empty">No pending listings.</p>}
      <div className="card-list">
        {listings.map((listing) => {
          const isOpen = expandedId === listing.id;
          return (
            <div className="card-block" key={listing.id}>
              <div
                className="card card-clickable"
                onClick={() => setExpandedId(isOpen ? null : listing.id)}
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
                  <span className="expand-hint">{isOpen ? '▲ Hide details' : '▼ Tap to view full details'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="detail-panel">
                  {listing.photo_url ? (
                    <img src={listing.photo_url} alt={listing.name} className="detail-image" />
                  ) : (
                    <div className="detail-image detail-image-placeholder">No photo</div>
                  )}

                  <div className="detail-section">
                    <h4>Seller Info</h4>
                    <p>Name: <span className="contact-highlight">{listing.seller_name}</span></p>
                    <p>Phone: <span className="contact-highlight">{listing.seller_phone}</span></p>
                    {listing.seller_email ? (
                      <p>Email: <span className="contact-highlight">{listing.seller_email}</span></p>
                    ) : null}
                  </div>

                  {listing.notes && (
                    <div className="detail-section">
                      <h4>Notes</h4>
                      <p>{listing.notes}</p>
                    </div>
                  )}

                  <div className="detail-section">
                    <h4>Edit before approving</h4>
                    <ListingForm
                      submitLabel="Save Changes"
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
                      onSubmit={(input) => handleSave(listing.id, input)}
                    />
                  </div>

                  <div className="actions">
                    <button
                      className="approve"
                      disabled={busyId === listing.id}
                      onClick={() => handleAction(listing.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="reject"
                      disabled={busyId === listing.id}
                      onClick={() => handleAction(listing.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
