import { useState, useEffect } from 'react';
import './index.css';
import UploadView from './components/UploadView';
import Dashboard from './components/Dashboard';
import PresentationMode from './components/PresentationMode';

const STORAGE_KEY = 'baseline-player-data';

function App() {
  const [view, setView] = useState('upload');
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.blast?.length > 0 || parsed.hittrax?.length > 0) {
          setData(parsed);
          setView('dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to load saved data:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save data:', err);
      }
    }
  }, [data]);

  const handleDataReady = (newData) => {
    setData(newData);
    setView('dashboard');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
    setView('upload');
  };

  const handlePresentationMode = () => {
    setView('presentation');
  };

  const handleExitPresentation = () => {
    setView('dashboard');
  };

  if (view === 'upload') {
    return <UploadView onDataReady={handleDataReady} />;
  }

  if (view === 'presentation' && data) {
    return <PresentationMode data={data} onExit={handleExitPresentation} />;
  }

  if (view === 'dashboard' && data) {
    return (
      <Dashboard
        data={data}
        onReset={handleReset}
        onPresentationMode={handlePresentationMode}
      />
    );
  }

  return <UploadView onDataReady={handleDataReady} />;
}

export default App;
