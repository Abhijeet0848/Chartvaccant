// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Train, RefreshCw, Layers, ShieldAlert, Sparkles, Check, Settings } from 'lucide-react';
import SearchForm from './components/SearchForm';
import TrainList from './components/TrainList';
import VacancyDashboard from './components/VacancyDashboard';

export default function App() {
  const [view, setView] = useState('SEARCH'); // 'SEARCH' or 'DASHBOARD'
  const [loading, setLoading] = useState(false);
  const [loadingVacancy, setLoadingVacancy] = useState(false);
  
  const [trains, setTrains] = useState([]);
  const [selectedTrainNumbers, setSelectedTrainNumbers] = useState([]);
  const [vacanciesByTrain, setVacanciesByTrain] = useState({});
  const [selectedClass, setSelectedClass] = useState('3A');


  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: ''
  });

  // Saved Favorites in LocalStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('irctc_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tracked trains waiting for chart preparation
  const [trackingCharts, setTrackingCharts] = useState([]);
  // Decoded PNR profile
  const [pnrProfile, setPnrProfile] = useState(null);

  // Synchronize favorites to local storage
  const handleToggleFavorite = (from, to, fromName, toName) => {
    let updated;
    const exists = favorites.some(fav => fav.from === from && fav.to === to);
    if (exists) {
      updated = favorites.filter(fav => !(fav.from === from && fav.to === to));
    } else {
      updated = [...favorites, { from, to, fromName, toName }];
    }
    setFavorites(updated);
    localStorage.setItem('irctc_favorites', JSON.stringify(updated));
  };

  const isCurrentFavorite = (from, to) => {
    return favorites.some(fav => fav.from === from && fav.to === to);
  };

  // Toggle chart preparation tracking
  const handleToggleTrackChart = (trainNo) => {
    // Request notification permission if they click track
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (trackingCharts.includes(trainNo)) {
      setTrackingCharts(prev => prev.filter(num => num !== trainNo));
    } else {
      setTrackingCharts(prev => [...prev, trainNo]);
      alert(`Started background tracking for train ${trainNo}. We will play a sound and alert you the second its reservation chart is prepared!`);
    }
  };

  // Play a pleasant chime sound programmatically
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Chime note 1 (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Chime note 2 (B5) slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.12); // B5
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);

    } catch (err) {
      console.warn('Audio chime failed:', err);
    }
  };

  // Trigger HTML5 Desktop Notification
  const showDesktopNotification = (trainNo, trainName) => {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(`IRCTC Chart Prepared!`, {
        body: `Train ${trainNo} (${trainName || 'Express'}) reservation chart is now available!`,
        tag: `chart-${trainNo}`
      });
    }
  };

  // Background polling for tracked trains
  useEffect(() => {
    if (trackingCharts.length === 0) return;

    console.log(`Setting up background tracking loop for trains: ${trackingCharts.join(', ')}`);
    
    // Check chart status every 15 seconds in background
    const interval = setInterval(async () => {
      for (const num of trackingCharts) {
        try {
          const response = await fetch('/api/vacancy', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              trainNo: num,
              boarding: searchParams.from,
              destination: searchParams.to,
              classCode: selectedClass,
              date: searchParams.date
            })
          });
          const json = await response.json();
          
          if (json.status === 'success') {
            const chartPrepared = json.chartPrepared;
            
            if (chartPrepared) {
              // Play sound alarm
              playAlertSound();
              // Trigger browser push
              showDesktopNotification(num, json.data?.trainName);
              
              // Update vacancies store
              setVacanciesByTrain(prev => ({
                ...prev,
                [num]: {
                  data: json.data,
                  source: json.source,
                  warning: json.warning || null
                }
              }));

              // Remove from tracking list
              setTrackingCharts(prev => prev.filter(n => n !== num));
              
              alert(`🔔 NOTIFICATION: Chart for Train ${num} (${json.data?.trainName || ''}) is now prepared! Vacancy dashboard has been updated.`);
            }
          }
        } catch (err) {
          console.error(`Error polling chart for train ${num}:`, err);
        }
      }
    }, 15000); // 15s checks

    return () => clearInterval(interval);
  }, [trackingCharts, searchParams, selectedClass]);

  // Handle route search
  const handleSearch = async (params) => {
    setLoading(true);
    setView('DASHBOARD');
    setSearchParams(params);
    setVacanciesByTrain({});
    setPnrProfile(null); // Clear PNR if they do a manual search
    setTrackingCharts([]);
    
    try {
      const response = await fetch('/api/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const json = await response.json();
      
      if (json.status === 'success') {
        const trainList = json.data;
        setTrains(trainList);
        
        // Auto select all trains by default!
        const allNums = trainList.map(t => t.number);
        setSelectedTrainNumbers(allNums);
        
        // Load default class vacancies for all trains
        let defaultClass = '3A';
        if (trainList.length > 0) {
          const firstTrainClasses = trainList[0].classes;
          if (!firstTrainClasses.includes('3A') && firstTrainClasses.length > 0) {
            defaultClass = firstTrainClasses[0];
          }
        }
        setSelectedClass(defaultClass);
        
        await fetchVacancies(allNums, defaultClass, params);
      } else {
        alert(`Error searching trains: ${json.message}`);
      }
    } catch (err) {
      console.error('Failed to search trains:', err);
      alert('Failed to connect to backend server. Make sure the Node server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PNR Search
  const handlePnrSearch = async (pnr) => {
    setLoading(true);
    setView('DASHBOARD');
    setVacanciesByTrain({});
    setTrackingCharts([]);
    
    try {
      const response = await fetch('/api/pnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr })
      });
      const json = await response.json();
      
      if (json.status === 'success') {
        const pnrData = json.data;
        setPnrProfile(pnrData);
        
        // Set search params based on PNR
        const params = {
          from: pnrData.from,
          to: pnrData.to,
          date: pnrData.date
        };
        setSearchParams(params);
        setSelectedClass(pnrData.classCode);

        // Fetch trains running on this route
        const trainsResponse = await fetch('/api/trains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        const trainsJson = await trainsResponse.json();

        if (trainsJson.status === 'success') {
          setTrains(trainsJson.data);
          // Only select the train matching PNR by default, but allow others to be checked
          setSelectedTrainNumbers([pnrData.trainNo]);
          
          // Fetch vacancy in background
          await fetchVacancies([pnrData.trainNo], pnrData.classCode, params);
        } else {
          alert('Could not fetch trains for this PNR route.');
        }

      } else {
        alert(`Error lookup PNR: ${json.message}`);
      }
    } catch (err) {
      console.error('Failed PNR lookup:', err);
      alert('Failed to connect to backend server during PNR lookup.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vacancies in parallel for selected trains and class
  const fetchVacancies = async (trainNumbers, classCode, params) => {
    if (trainNumbers.length === 0) return;
    setLoadingVacancy(true);

    const promises = trainNumbers.map(async (num) => {
      try {
        const response = await fetch('/api/vacancy', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            trainNo: num,
            boarding: params.from,
            destination: params.to,
            classCode: classCode,
            date: params.date
          })
        });
        const json = await response.json();
        return { trainNo: num, data: json };
      } catch (err) {
        console.error(`Failed to fetch vacancy for train ${num}:`, err);
        return { trainNo: num, data: null, error: err.message };
      }
    });

    const results = await Promise.all(promises);
    
    const newVacancies = {};
    results.forEach(res => {
      if (res.data && res.data.status === 'success') {
        newVacancies[res.trainNo] = {
          data: res.data.data,
          source: res.data.source,
          warning: res.data.warning || null
        };
      } else {
        const errMsg = res.data && res.data.message ? res.data.message : (res.error || 'Connection Failed');
        newVacancies[res.trainNo] = {
          error: errMsg
        };
      }
    });

    setVacanciesByTrain(prev => ({
      ...prev,
      ...newVacancies
    }));
    setLoadingVacancy(false);
  };

  // Triggered when travel class changes
  const handleClassChange = async (newClass) => {
    setSelectedClass(newClass);
    await fetchVacancies(selectedTrainNumbers, newClass, searchParams);
  };

  // Toggle train selection
  const handleToggleSelectTrain = async (trainNo) => {
    let updated;
    if (selectedTrainNumbers.includes(trainNo)) {
      updated = selectedTrainNumbers.filter(n => n !== trainNo);
    } else {
      updated = [...selectedTrainNumbers, trainNo];
    }
    setSelectedTrainNumbers(updated);
    
    if (!selectedTrainNumbers.includes(trainNo) && !vacanciesByTrain[trainNo]) {
      await fetchVacancies([trainNo], selectedClass, searchParams);
    }
  };

  // Select all / deselect all helper
  const handleSelectAll = async () => {
    const allNums = trains.map(t => t.number);
    setSelectedTrainNumbers(allNums);
    
    const missing = allNums.filter(num => !vacanciesByTrain[num]);
    if (missing.length > 0) {
      await fetchVacancies(missing, selectedClass, searchParams);
    }
  };

  const handleDeselectAll = () => {
    setSelectedTrainNumbers([]);
  };



  return (
    <>
      <header>
        <div className="logo-container">
          <Eye size={28} className="logo-icon" />
          <div className="logo-text">IRCTC Vacancy Hub</div>
        </div>

      </header>

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Top title area */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>Unified Chart Vacancy Tracker</span>
            <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-primary)', borderRadius: '6px', color: 'var(--accent-primary)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              v2.0
            </span>
          </h1>
          <p className="subtitle">
            Compare post-charting vacancies across all trains on a route simultaneously. No more searching one train at a time.
          </p>
        </div>

        {/* Search Panel */}
        <SearchForm 
          onSearch={handleSearch} 
          onPnrSearch={handlePnrSearch}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          isCurrentFavorite={isCurrentFavorite}
          loading={loading} 
        />

        {/* View Routing */}
        {view === 'SEARCH' ? (
          <div className="card-glass empty-state" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="train-icon-box" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={30} />
              </div>
            </div>
            <div className="empty-title">Ready for Journey Plan</div>
            <p style={{ maxWidth: '600px' }}>
              Select a travel route (e.g. <strong>New Delhi (NDLS)</strong> to <strong>Howrah Jn (HWH)</strong>) or enter a PNR number to track vacant berths in real-time.
            </p>
            
            {/* Quick Demo links */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>POPULAR DEMO ROUTES:</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => handleSearch({ from: 'NDLS', to: 'HWH', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Delhi (NDLS) → Howrah (HWH)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => handleSearch({ from: 'NDLS', to: 'MMCT', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Delhi (NDLS) → Mumbai (MMCT)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => handleSearch({ from: 'SBC', to: 'MAS', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Bengaluru (SBC) → Chennai (MAS)
                </button>
              </div>
              
              {/* Quick Demo PNRs */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>DEMO PNR LOOKUPS:</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderStyle: 'dashed' }}
                  onClick={() => handlePnrSearch('4341029410')}
                >
                  PNR: 4341029410 (Delhi Rajdhani, 3AC)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderStyle: 'dashed' }}
                  onClick={() => handlePnrSearch('4341029411')}
                >
                  PNR: 4341029411 (Mumbai Rajdhani, 2AC)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard Main Grid */
          <div className="dashboard-grid">
            <TrainList
              trains={trains}
              selectedTrainNumbers={selectedTrainNumbers}
              onToggleSelectTrain={handleToggleSelectTrain}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            <VacancyDashboard
              trains={trains}
              selectedTrainNumbers={selectedTrainNumbers}
              vacanciesByTrain={vacanciesByTrain}
              selectedClass={selectedClass}
              setSelectedClass={handleClassChange}
              loadingVacancy={loadingVacancy}
              searchParams={searchParams}
              trackingCharts={trackingCharts}
              onToggleTrackChart={handleToggleTrackChart}
              pnrProfile={pnrProfile}
            />
          </div>
        )}
      </main>

      <footer>
        <p>© 2026 IRCTC Vacancy Hub. Companion tool for Indian Railways Reservation Charts.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Disclaimer: This is an independent web application. Train data, coach diagrams, and vacant berths are loaded via the Live API Proxy or simulated using sandbox route layouts.
        </p>
      </footer>
    </>
  );
}
