import { useRef, useState } from 'react';
import { changePin } from './lib/api';

interface SettingsProps {
  pin: string;
  onPinChanged: () => void;
}

function PinBoxes({
  digits,
  setDigits,
  refs,
}: {
  digits: string[];
  setDigits: (v: string[]) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}) {
  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 3) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="pin-box-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="pin-box"
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

export default function Settings({ pin, onPinChanged }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const [oldDigits, setOldDigits] = useState(['', '', '', '']);
  const [newDigits, setNewDigits] = useState(['', '', '', '']);
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const oldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  function resetForm() {
    setOldDigits(['', '', '', '']);
    setNewDigits(['', '', '', '']);
    setConfirmDigits(['', '', '', '']);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const oldPin = oldDigits.join('');
    const newPin = newDigits.join('');
    const confirmPin = confirmDigits.join('');

    if (oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
      return setError('Fill in all PIN boxes.');
    }
    if (oldPin !== pin) {
      return setError('Old PIN is incorrect.');
    }
    if (newPin !== confirmPin) {
      return setError('New PIN and confirmation do not match.');
    }

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

      <div className="settings-box" onClick={() => !open && setOpen(true)}>
        <div className="settings-box-header">
          <span>Change Password</span>
          <span className="expand-hint">{open ? '▲' : '▼'}</span>
        </div>

        {open && (
          <form className="stock-form pin-change-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <label className="pin-field-label">Old PIN</label>
            <PinBoxes digits={oldDigits} setDigits={setOldDigits} refs={oldRefs} />

            <label className="pin-field-label">New PIN</label>
            <PinBoxes digits={newDigits} setDigits={setNewDigits} refs={newRefs} />

            <label className="pin-field-label">Confirm New PIN</label>
            <PinBoxes digits={confirmDigits} setDigits={setConfirmDigits} refs={confirmRefs} />

            {error && <p className="error">{error}</p>}
            {success && <p className="success-msg">PIN updated — please re-enter to continue.</p>}

            <div className="form-actions">
              <button className="pin-change-submit" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Change PIN'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => { setOpen(false); resetForm(); }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
