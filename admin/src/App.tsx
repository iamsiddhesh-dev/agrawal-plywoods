import { useState } from 'react';
import PinGate from './PinGate';
import PendingListings from './PendingListings';
import PendingRequests from './PendingRequests';
import './App.css';

type Tab = 'listings' | 'requests';

function App() {
  const [pin, setPin] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('listings');

  if (!pin) {
    return <PinGate onUnlock={setPin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agrawal Plywoods Admin</h1>
        <button className="logout" onClick={() => setPin(null)}>
          Lock
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
      </nav>
      <main>
        {tab === 'listings' ? <PendingListings pin={pin} /> : <PendingRequests pin={pin} />}
      </main>
    </div>
  );
}

export default App;
