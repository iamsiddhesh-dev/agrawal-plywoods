import { useCallback, useEffect, useState } from 'react';
import { fetchPendingRequests, setRequestStatus } from './lib/api';
import Modal from './Modal';
import type { PendingRequest } from './types';

interface PendingRequestsProps {
  pin: string;
}

export default function PendingRequests({ pin }: PendingRequestsProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
      if (openId === id) setOpenId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  const openRequest = requests.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <div className="tab-header">
        <h2>Pending Contact Requests</h2>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && requests.length === 0 && <p className="empty">No pending requests.</p>}
      <div className="card-list">
        {requests.map((request) => (
          <div
            className="card card-clickable"
            key={request.id}
            onClick={() => setOpenId(request.id)}
            role="button"
            tabIndex={0}
          >
            <div className="card-body">
              <h3 className="clamp-2">{request.listing_name}</h3>
              <p>Buyer: {request.buyer_name}</p>
              <span className="expand-hint">View full details ›</span>
            </div>
          </div>
        ))}
      </div>

      {openRequest && (
        <Modal title={openRequest.listing_name} onClose={() => setOpenId(null)}>
          <div className="detail-section">
            <h4>Buyer Info</h4>
            <p>Name: <span className="contact-highlight">{openRequest.buyer_name}</span></p>
            <p>Phone: <span className="contact-highlight">{openRequest.buyer_phone}</span></p>
          </div>
          <div className="detail-section">
            <h4>Requested</h4>
            <p>{new Date(openRequest.created_at).toLocaleString()}</p>
          </div>
          <div className="actions">
            <button
              className="btn btn-approve"
              disabled={busyId === openRequest.id}
              onClick={() => handleAction(openRequest.id, 'approved')}
            >
              Approve
            </button>
            <button
              className="btn btn-reject"
              disabled={busyId === openRequest.id}
              onClick={() => handleAction(openRequest.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
