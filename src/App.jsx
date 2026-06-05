// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Train, RefreshCw, Layers, ShieldAlert, Sparkles, Check, Settings, Home } from 'lucide-react';
import SearchForm from './components/SearchForm';
import TrainList from './components/TrainList';
import VacancyDashboard from './components/VacancyDashboard';
import LoginModal from './components/LoginModal';

export default function App() {
  // Auth states
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('irctc_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingSeat, setPendingBookingSeat] = useState(null);

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

  // Booking states
  const [bookingModalSeat, setBookingModalSeat] = useState(null);
  const [successTicket, setSuccessTicket] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);

  // Fetch bookings from MongoDB on login
  useEffect(() => {
    if (user && user.token) {
      const fetchMyBookings = async () => {
        try {
          const response = await fetch('/api/bookings', {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const json = await response.json();
          if (json.status === 'success') {
            setBookedSeats(json.data);
          }
        } catch (err) {
          console.error('Failed to fetch bookings:', err);
        }
      };
      fetchMyBookings();
    } else {
      setBookedSeats([]);
    }
  }, [user]);

  const handleLoginSuccess = (authData) => {
    setUser(authData);
    localStorage.setItem('irctc_user', JSON.stringify(authData));
    if (pendingBookingSeat) {
      setBookingModalSeat(pendingBookingSeat);
      setPendingBookingSeat(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('irctc_user');
    setBookedSeats([]);
    setPnrProfile(null);
  };

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
    
    if (params.byTrainNo) {
      const singleTrain = {
        number: params.trainNo,
        name: params.trainName || `Train ${params.trainNo}`,
        from: params.from,
        to: params.to,
        depTime: '12:00',
        arrTime: '18:00',
        duration: '6h 00m',
        classes: ['SL', '3A', '2A'],
        runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        boardingStation: params.from,
        destinationStation: params.to,
        date: params.date
      };
      
      setTrains([singleTrain]);
      setSelectedTrainNumbers([params.trainNo]);
      setSelectedClass('3A');
      
      try {
        await fetchVacancies([params.trainNo], '3A', params);
      } catch (err) {
        console.error('Failed to fetch vacancies by train number:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

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
        
        if (!params.onlySearchTrains) {
          await fetchVacancies(allNums, defaultClass, params);
        }
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

  const handleFetchSingleVacancy = async (trainNo) => {
    await fetchVacancies([trainNo], selectedClass, searchParams);
  };

  const handleBookSeat = (seat) => {
    if (!user) {
      setPendingBookingSeat(seat);
      setShowLoginModal(true);
    } else {
      setBookingModalSeat(seat);
    }
  };

  const handleConfirmBooking = async (passengerDetails) => {
    if (!bookingModalSeat || !user) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          trainNo: bookingModalSeat.trainNo,
          trainName: bookingModalSeat.trainName || `Train ${bookingModalSeat.trainNo}`,
          coach: bookingModalSeat.coach,
          berthNo: bookingModalSeat.berthNo,
          berthType: bookingModalSeat.berthType,
          from: bookingModalSeat.from,
          to: bookingModalSeat.to,
          passengerName: passengerDetails.name,
          passengerAge: passengerDetails.age,
          passengerGender: passengerDetails.gender,
          classCode: selectedClass,
          date: searchParams.date || new Date().toISOString().split('T')[0]
        })
      });

      const json = await response.json();
      if (json.status === 'success') {
        const ticket = json.data;

        setBookedSeats(prev => [ticket, ...prev]);

        // Update vacancies: remove this berth from vacanciesByTrain
        setVacanciesByTrain(prev => {
          const trainNo = bookingModalSeat.trainNo;
          if (!prev[trainNo] || !prev[trainNo].data) return prev;
          
          const originalVacant = prev[trainNo].data.vacantBerths || [];
          const updatedVacant = originalVacant.filter(
            b => !(b.coach === bookingModalSeat.coach && b.berthNo === bookingModalSeat.berthNo)
          );

          return {
            ...prev,
            [trainNo]: {
              ...prev[trainNo],
              data: {
                ...prev[trainNo].data,
                vacantBerths: updatedVacant
              }
            }
          };
        });

        setPnrProfile(ticket);
        setSuccessTicket(ticket);
        setBookingModalSeat(null);
      } else {
        alert(`Booking failed: ${json.message}`);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      alert('Failed to submit booking. Please check connection and try again.');
    }
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
      {/* Official IRCTC Loading Overlay */}
      {loading && (
        <div className="train-loader-overlay">
          <div className="train-loader-text">Loading Chart Data</div>
          <div className="train-loader-track">
            <div className="train-loader-bar"></div>
          </div>
        </div>
      )}

      {/* Official IRCTC Logo Header */}
      <header className="irctc-header">
        <div className="irctc-logo-left">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r="46" fill="#0f2b5c" stroke="#ffffff" strokeWidth="2" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e0a020" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="28" fill="#0f2b5c" stroke="#ffffff" strokeWidth="1.5" />
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x2 = 50 + 28 * Math.cos(angle);
              const y2 = 50 + 28 * Math.sin(angle);
              return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#ffffff" strokeWidth="1.5" />;
            })}
            <circle cx="50" cy="50" r="8" fill="#e0a020" />
          </svg>
        </div>
        <div className="irctc-header-title">Reservation Chart</div>
        <div className="irctc-header-auth" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', marginRight: '1.5rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span id="header-user-welcome" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Welcome, <strong>{user.user.username}</strong>
              </span>
              <button 
                id="header-logout-btn"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1.5px solid #dc3545',
                  color: '#dc3545',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={() => setShowLoginModal(true)}
              style={{
                background: '#003399',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Login / Register
            </button>
          )}
        </div>
        <div className="irctc-logo-right">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path d="M20,50 Q50,20 80,50 Q50,80 20,50" fill="none" stroke="#003399" strokeWidth="8" strokeLinecap="round" />
            <path d="M35,50 Q50,35 65,50 Q50,65 35,50" fill="none" stroke="#ff6600" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="50" r="6" fill="#003399" />
            <text x="50" y="86" fontSize="12" fontWeight="bold" fill="#003399" textAnchor="middle" fontFamily="sans-serif">IRCTC</text>
          </svg>
        </div>
      </header>

      {/* Blue Trip Details Banner (Shown after search/PNR lookup) */}
      <div className="trip-details-bar">
        <button className="btn-home" onClick={() => setView('SEARCH')} title="Back to Search">
          <Home size={18} />
        </button>
        <div className="trip-details-content">
          {view === 'SEARCH' ? (
            <div className="trip-detail-item">
              <span>Welcome to Unified Reservation Chart Vacancy System</span>
            </div>
          ) : (
            <>
              <div className="trip-detail-item">
                <strong>Train No:</strong> <span>{selectedTrainNumbers.length > 0 ? selectedTrainNumbers.join(', ') : 'All Selected'}</span>
              </div>
              <div className="trip-detail-item">
                <strong>Journey Date:</strong> <span>{searchParams.date}</span>
              </div>
              <div className="trip-detail-item">
                <strong>Boarding Station:</strong> <span>{searchParams.from}</span>
              </div>
              <div className="trip-detail-item">
                <strong>Destination Station:</strong> <span>{searchParams.to}</span>
              </div>
              <div className="trip-detail-item">
                <strong>Chart Status:</strong> <span style={{ color: '#3bd391' }}>Chart Prepared</span>
              </div>
            </>
          )}
        </div>
      </div>

      <main>
        {/* Search Panel */}
        {view === 'SEARCH' && (
          <SearchForm 
            onSearch={handleSearch} 
            onPnrSearch={handlePnrSearch}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            isCurrentFavorite={isCurrentFavorite}
            loading={loading} 
          />
        )}

        {/* View Routing */}
        {view === 'SEARCH' ? (
          <div className="empty-state" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="irctc-logo-left" style={{ width: '48px', height: '48px' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <circle cx="50" cy="50" r="46" fill="#0f2b5c" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e0a020" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="28" fill="#0f2b5c" stroke="#ffffff" strokeWidth="1.5" />
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x2 = 50 + 28 * Math.cos(angle);
                    const y2 = 50 + 28 * Math.sin(angle);
                    return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#ffffff" strokeWidth="1.5" />;
                  })}
                  <circle cx="50" cy="50" r="8" fill="#e0a020" />
                </svg>
              </div>
            </div>
            <div className="empty-title">Ready for Journey Plan</div>
            <p style={{ maxWidth: '600px', fontSize: '0.95rem' }}>
              Select a travel route (e.g. <strong>NDLS</strong> to <strong>HWH</strong>) or enter a PNR number to check vacant berths.
            </p>
            
            {/* Quick Demo links */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>POPULAR DEMO ROUTES:</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="filter-pill"
                  style={{ background: '#ffffff', border: '1px solid #dee2e6', cursor: 'pointer', padding: '0.4rem 1rem' }}
                  onClick={() => handleSearch({ from: 'NDLS', to: 'HWH', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Delhi (NDLS) → Howrah (HWH)
                </button>
                <button
                  type="button"
                  className="filter-pill"
                  style={{ background: '#ffffff', border: '1px solid #dee2e6', cursor: 'pointer', padding: '0.4rem 1rem' }}
                  onClick={() => handleSearch({ from: 'NDLS', to: 'MMCT', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Delhi (NDLS) → Mumbai (MMCT)
                </button>
                <button
                  type="button"
                  className="filter-pill"
                  style={{ background: '#ffffff', border: '1px solid #dee2e6', cursor: 'pointer', padding: '0.4rem 1rem' }}
                  onClick={() => handleSearch({ from: 'SBC', to: 'MAS', date: searchParams.date || new Date().toISOString().split('T')[0] })}
                >
                  Bengaluru (SBC) → Chennai (MAS)
                </button>
              </div>
              
              {/* Quick Demo PNRs */}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '1rem' }}>DEMO PNR LOOKUPS:</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="filter-pill"
                  style={{ background: '#ffffff', border: '1px solid #dee2e6', cursor: 'pointer', padding: '0.4rem 1rem', borderStyle: 'dashed' }}
                  onClick={() => handlePnrSearch('4341029410')}
                >
                  PNR: 4341029410 (Delhi Rajdhani, 3AC)
                </button>
                <button
                  type="button"
                  className="filter-pill"
                  style={{ background: '#ffffff', border: '1px solid #dee2e6', cursor: 'pointer', padding: '0.4rem 1rem', borderStyle: 'dashed' }}
                  onClick={() => handlePnrSearch('4341029411')}
                >
                  PNR: 4341029411 (Mumbai Rajdhani, 2AC)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Dashboard Main Grid (Timeline Slider on top, detailed vacancy deck underneath) */
          <div className="dashboard-grid">
            <TrainList
              trains={trains}
              selectedTrainNumbers={selectedTrainNumbers}
              onToggleSelectTrain={handleToggleSelectTrain}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              vacanciesByTrain={vacanciesByTrain}
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
              onFetchSingleVacancy={handleFetchSingleVacancy}
              onBookSeat={handleBookSeat}
            />
          </div>
        )}
      </main>

      <footer>
        <p>© 2026 IRCTC Vacancy Hub. Companion tool for Indian Railways Reservation Charts.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Disclaimer: This is an independent web application. Train data, coach diagrams, and vacant berths are loaded via the Live API Proxy or simulated using sandbox route layouts.
        </p>
      </footer>

      {/* Booking Form Modal */}
      {bookingModalSeat && (
        <BookingModal 
          seat={bookingModalSeat} 
          onClose={() => setBookingModalSeat(null)} 
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => {
            setShowLoginModal(false);
            setPendingBookingSeat(null);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Success Ticket Modal */}
      {successTicket && (
        <TicketModal 
          ticket={successTicket} 
          onClose={() => setSuccessTicket(null)} 
        />
      )}
    </>
  );
}

function BookingModal({ seat, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter passenger name.');
    if (!age || age <= 0) return alert('Please enter a valid age.');
    onConfirm({ name, age, gender });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        border: '1px solid #ced4da'
      }}>
        <div style={{
          background: '#0f2b5c',
          color: '#ffffff',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>IRCTC Seat Booking Simulator</h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#ffffff', 
              fontSize: '1.25rem', 
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '6px', 
            padding: '0.75rem', 
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>Train No:</strong> {seat.trainNo}</div>
              <div><strong>Coach:</strong> {seat.coach}</div>
              <div><strong>Berth / Seat:</strong> {seat.berthNo} ({seat.berthType})</div>
              <div><strong>From:</strong> {seat.from}</div>
              <div><strong>To:</strong> {seat.to}</div>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Passenger Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Age</label>
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
                min="1"
                max="120"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  height: '34px'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #dee2e6', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f8f9fa',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                padding: '0.45rem 1rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#003399',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '0.45rem 1.25rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketModal({ ticket, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        border: '1px solid #ced4da'
      }}>
        {/* Ticket Header */}
        <div style={{
          background: '#003399',
          color: '#ffffff',
          padding: '1.25rem',
          textAlign: 'center',
          position: 'relative'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ background: '#28a745', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✓</span>
            <span>Booking Successful!</span>
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Your berth has been reserved successfully.</p>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* E-Ticket Display */}
          <div style={{
            border: '2px dashed #ced4da',
            borderRadius: '6px',
            padding: '1rem',
            background: '#fffbef',
            fontFamily: 'monospace',
            position: 'relative'
          }}>
            {/* Watermark logo */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.05,
              fontSize: '4rem',
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}>
              IRCTC
            </div>

            <div style={{ borderBottom: '1px solid #ced4da', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span><strong>PNR:</strong> {ticket.pnr}</span>
              <span><strong>DATE:</strong> {ticket.date}</span>
            </div>
            
            <div style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>
              <div><strong>TRAIN:</strong> {ticket.trainNo} / {ticket.trainName}</div>
              <div><strong>CLASS:</strong> {ticket.classCode}</div>
              <div><strong>FROM:</strong> {ticket.from} ➔ <strong>TO:</strong> {ticket.to}</div>
            </div>

            <div style={{ borderTop: '1px dashed #ced4da', paddingTop: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem' }}>
                <span><strong>PASSENGER</strong></span>
                <span><strong>AGE/SEX</strong></span>
                <span><strong>SEAT</strong></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem', marginTop: '0.25rem', color: '#333' }}>
                <span>{ticket.passengerName.toUpperCase()}</span>
                <span>{ticket.passengerAge} / {ticket.passengerGender[0]}</span>
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>{ticket.coach}-{ticket.berthNo}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => window.print()}
              style={{
                background: '#f8f9fa',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                padding: '0.5rem 1.25rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Print Ticket
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#003399',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '0.5rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
