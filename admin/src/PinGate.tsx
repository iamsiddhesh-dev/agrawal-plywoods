import { useState } from 'react';
import { checkPin } from './lib/api';

interface PinGateProps {
  onUnlock: (pin: string) => void;
}

export default function PinGate({ onUnlock }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setChecking(true);
    try {
      const ok = await checkPin(pin);
      if (ok) {
        onUnlock(pin);
      } else {
        setError('Incorrect PIN');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="pin-gate">
      <form onSubmit={handleSubmit} className="pin-gate-form">
        <h1>Agrawal Plywoods Admin</h1>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="4-digit PIN"
          autoFocus
        />
        <button type="submit" disabled={pin.length !== 4 || checking}>
          {checking ? 'Checking...' : 'Unlock'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
