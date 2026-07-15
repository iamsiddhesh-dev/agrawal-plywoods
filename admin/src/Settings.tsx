import { useRef, useState } from 'react';
import { changePin } from './lib/api';

interface SettingsProps {
  pin: string;
  onPinChanged: () => void;
}

export default function Settings({ pin, onPinChanged }: SettingsProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(arr: string[], setArr: (v: string[]) => void, refs: (HTMLInputElement | null)[], index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...arr];
    next[index] = clean;
    setArr(next);
    if (clean && index < 3) refs[index + 1]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const newPin = digits.join('');
    const confirmPin = confirmDigits.join('');

    if (newPin.length !== 4) return setError('Enter a 4-digit PIN.');
    if (newPin !== confirmPin) return setError('PINs do not match.');

    setSaving(true);
    try {
      await changePin(pin, newPin);
      setSuccess(true);
      setTimeout(() => onPinChanged(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="tab-header">
        <h2>Settings</h2>
      </div>
      <form className="stock-form" onSubmit={handleSubmit} style={{ maxWidth: 320 }}>
        <p className="empty">Change your admin PIN</p>

        <label className="pin-field-label">New PIN</label>
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
              onChange={(e) => setDigit(digits, setDigits, inputRefs.current, i, e.target.value)}
            />
          ))}
        </div>

        <label className="pin-field-label">Confirm New PIN</label>
        <div className="pin-box-row">
          {confirmDigits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { confirmRefs.current[i] = el; }}
              className="pin-box"
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(confirmDigits, setConfirmDigits, confirmRefs.current, i, e.target.value)}
            />
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success-msg">PIN updated — please re-enter to continue.</p>}

        <button className="approve" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Change PIN'}
        </button>
      </form>
    </div>
  );
}
