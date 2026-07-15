import { useCallback, useEffect, useState } from 'react';
import { fetchPendingRequests, setRequestStatus } from './lib/api';
import type { PendingRequest } from './types';

interface PendingRequestsProps {
  pin: string;
}

export default function PendingRequests({ pin }: PendingRequestsProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await fetchPendingRequests(pin));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
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
      await setRequestStatus(pin, id, status);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="tab-header">
        <h2>Pending Contact Requests</h2>
        <button onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && requests.length === 0 && <p className="empty">No pending requests.</p>}
      <div className="card-list">
        {requests.map((request) => (
          <div className="card" key={request.id}>
            <div className="card-body">
              <h3 className="clamp-2">{request.listing_name}</h3>
              <p>
                Buyer: {request.buyer_name} &middot;{' '}
                <span className="contact-highlight">{request.buyer_phone}</span>
              </p>
              <p className="notes">{new Date(request.created_at).toLocaleString()}</p>
              <div className="actions">
                <button
                  className="approve"
                  disabled={busyId === request.id}
                  onClick={() => handleAction(request.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="reject"
                  disabled={busyId === request.id}
                  onClick={() => handleAction(request.id, 'rejected')}
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
