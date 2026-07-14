import { useCallback, useEffect, useState } from 'react';
import { fetchPendingListings, setListingStatus } from './lib/api';
import type { PendingListing } from './types';

interface PendingListingsProps {
  pin: string;
}

export default function PendingListings({ pin }: PendingListingsProps) {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
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
                ₹{listing.price_per_unit} / {listing.unit} &middot; Qty:{' '}
                {listing.quantity_available}
              </p>
              {listing.notes && <p className="notes">{listing.notes}</p>}
              <p>
                Seller: {listing.seller_name} &middot; {listing.seller_phone}
                {listing.seller_email ? ` · ${listing.seller_email}` : ''}
              </p>
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
          </div>
        ))}
      </div>
    </div>
  );
}
