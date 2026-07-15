import { useRef, useState } from 'react';
import { checkPin } from './lib/api';

interface PinGateProps {
  onUnlock: (pin: string) => void;
}

export default function PinGate({ onUnlock }: PinGateProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pin = digits.join('');

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

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
        <img src="/logo.png" alt="Broker" className="pin-gate-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <h1>Agrawal Plywoods Admin</h1>
        <p className="pin-gate-subtitle">Enter your 4-digit PIN</p>
        <div className="pin-box-row">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="pin-box"
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>
        <button type="submit" disabled={pin.length !== 4 || checking}>
          {checking ? 'Checking...' : 'Unlock'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
