import { useState } from 'react';
import PinGate from './PinGate';
import PendingListings from './PendingListings';
import PendingRequests from './PendingRequests';
import MyStock from './MyStock';
import Settings from './Settings';
import './App.css';

type Tab = 'listings' | 'requests' | 'stock' | 'settings';

function App() {
  const [pin, setPin] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('listings');

  if (!pin) {
    return <PinGate onUnlock={setPin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <img src="/logo.png" alt="Broker" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1>Agrawal Plywoods Admin</h1>
        </div>
        <button className="logout" onClick={() => setPin(null)} aria-label="Lock">
          🔒
        </button>
      </header>
      <nav className="tabs">
        <button
          className={tab === 'listings' ? 'active' : ''}
          onClick={() => setTab('listings')}
        >
          Pending Listings
        </button>
        <button
          className={tab === 'requests' ? 'active' : ''}
          onClick={() => setTab('requests')}
        >
          Pending Contact Requests
        </button>
        <button
          className={tab === 'stock' ? 'active' : ''}
          onClick={() => setTab('stock')}
        >
          My Stock
        </button>
        <button
          className={tab === 'settings' ? 'active' : ''}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </nav>
      <main>
        {tab === 'listings' && <PendingListings pin={pin} />}
        {tab === 'requests' && <PendingRequests pin={pin} />}
        {tab === 'stock' && <MyStock pin={pin} />}
        {tab === 'settings' && <Settings pin={pin} onPinChanged={() => setPin(null)} />}
      </main>
    </div>
  );
}

export default App;
