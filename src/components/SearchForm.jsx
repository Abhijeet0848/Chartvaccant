// src/components/SearchForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Search, Train, Star, FileText } from 'lucide-react';

export default function SearchForm({ onSearch, onPnrSearch, favorites = [], onToggleFavorite, isCurrentFavorite, loading }) {
  const [searchMode, setSearchMode] = useState('ROUTE'); // 'ROUTE' or 'TRAIN'
  
  // Route Search states
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [onlySearchTrains, setOnlySearchTrains] = useState(false);
  
  // Train Number Search states
  const [trainNumberQuery, setTrainNumberQuery] = useState('');
  const [trainStations, setTrainStations] = useState([]);
  const [selectedBoarding, setSelectedBoarding] = useState('');
  const [resolvedTrainName, setResolvedTrainName] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [trainSuggestions, setTrainSuggestions] = useState([]);
  
  // General states
  const [pnrInput, setPnrInput] = useState('');
  
  // Set default date to today
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [date, setDate] = useState(getTodayString());

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'from' or 'to'

  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Load route suggestions
  useEffect(() => {
    const fetchSuggestions = async (query, setList) => {
      if (query.trim().length < 2) {
        setList([]);
        return;
      }
      try {
        const response = await fetch(`/api/stations?q=${encodeURIComponent(query)}`);
        const json = await response.json();
        if (json.status === 'success') {
          setList(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch station suggestions:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      if (activeInput === 'from') {
        fetchSuggestions(fromQuery, setFromSuggestions);
      } else if (activeInput === 'to') {
        fetchSuggestions(toQuery, setToSuggestions);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [fromQuery, toQuery, activeInput]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setFromSuggestions([]);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setToSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load train schedule when trainNumber changes
  useEffect(() => {
    const fetchSchedule = async () => {
      const trimmed = trainNumberQuery.trim();
      if (trimmed.length !== 5) {
        setTrainStations([]);
        setSelectedBoarding('');
        setResolvedTrainName('');
        return;
      }
      setLoadingSchedule(true);
      try {
        const response = await fetch(`/api/train-schedule?trainNo=${encodeURIComponent(trimmed)}`);
        const json = await response.json();
        if (json.status === 'success') {
          setTrainStations(json.stations);
          setResolvedTrainName(json.trainName);
          if (json.stations.length > 0) {
            setSelectedBoarding(json.stations[0].code);
          }
        } else {
          setTrainStations([]);
          setSelectedBoarding('');
          setResolvedTrainName('');
        }
      } catch (err) {
        console.error('Failed to fetch train schedule:', err);
        setTrainStations([]);
        setSelectedBoarding('');
        setResolvedTrainName('');
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [trainNumberQuery]);

  // Autocomplete train numbers as they type
  useEffect(() => {
    const trimmed = trainNumberQuery.trim();
    if (trimmed.length < 1) {
      setTrainSuggestions([]);
      return;
    }
    // Search pre-defined list matches
    const matches = [
      { number: '12302', name: 'Howrah Rajdhani Express' },
      { number: '12314', name: 'Sealdah Rajdhani Express' },
      { number: '12382', name: 'Poorva Express (via Gaya)' },
      { number: '12304', name: 'Poorva Express (via Patna)' },
      { number: '12260', name: 'Sealdah Duronto Express' },
      { number: '12952', name: 'Mumbai Central Rajdhani' },
      { number: '12954', name: 'August Kranti Rajdhani' },
      { number: '12926', name: 'Paschim Express' },
      { number: '12008', name: 'Mysuru - Chennai Shatabdi' },
      { number: '22626', name: 'Bengaluru - Chennai Double Decker' },
      { number: '12640', name: 'Brindavan Express' }
    ].filter(t => t.number.startsWith(trimmed) || t.name.toLowerCase().includes(trimmed.toLowerCase()));
    setTrainSuggestions(matches);
  }, [trainNumberQuery]);

  const handleStationSelect = (station, type) => {
    if (type === 'from') {
      setFromStation(station);
      setFromQuery(`${station.name} (${station.code})`);
      setFromSuggestions([]);
    } else {
      setToStation(station);
      setToQuery(`${station.name} (${station.code})`);
      setToSuggestions([]);
    }
    setActiveInput(null);
  };

  const handleSwap = () => {
    const tempStation = fromStation;
    const tempQuery = fromQuery;

    setFromStation(toStation);
    setFromQuery(toQuery);

    setToStation(tempStation);
    setToQuery(tempQuery);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromStation || !toStation) {
      alert('Please select both boarding and destination stations from the search suggestions.');
      return;
    }
    if (fromStation.code === toStation.code) {
      alert('Boarding and destination stations cannot be the same.');
      return;
    }
    onSearch({
      from: fromStation.code,
      to: toStation.code,
      date,
      onlySearchTrains
    });
  };

  const handleTrainSubmit = (e) => {
    e.preventDefault();
    if (trainNumberQuery.trim().length !== 5) {
      alert('Please enter a valid 5-digit train number.');
      return;
    }
    if (!selectedBoarding) {
      alert('Please select a boarding station.');
      return;
    }
    const terminalStation = trainStations[trainStations.length - 1];
    onSearch({
      trainNo: trainNumberQuery,
      trainName: resolvedTrainName,
      from: selectedBoarding,
      to: terminalStation ? terminalStation.code : selectedBoarding,
      date,
      byTrainNo: true
    });
  };

  const handlePnrSubmit = (e) => {
    e.preventDefault();
    if (pnrInput.trim().length !== 10) {
      alert('Please enter a valid 10-digit PNR number.');
      return;
    }
    onPnrSearch(pnrInput.trim());
  };

  const handleFavoriteClick = (fav) => {
    const fromObj = { code: fav.from, name: fav.fromName || fav.from };
    const toObj = { code: fav.to, name: fav.toName || fav.to };
    
    setFromStation(fromObj);
    setFromQuery(`${fromObj.name} (${fromObj.code})`);
    
    setToStation(toObj);
    setToQuery(`${toObj.name} (${toObj.code})`);
    
    setSearchMode('ROUTE');
    onSearch({
      from: fav.from,
      to: fav.to,
      date,
      onlySearchTrains
    });
  };

  const canStar = fromStation && toStation;
  const isStarred = canStar && isCurrentFavorite(fromStation.code, toStation.code);

  return (
    <div className="search-card">
      
      {/* PNR Quick Lookup Section */}
      <div className="pnr-search-section">
        <h3 className="search-card-title" style={{ borderBottom: 'none', marginBottom: '0.5rem', paddingBottom: 0 }}>
          <FileText size={18} />
          <span>Quick PNR Vacancy Lookup</span>
        </h3>
        
        <form onSubmit={handlePnrSubmit} className="pnr-form" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pnr-label" style={{ minWidth: '150px' }}>
            <span>Enter 10-Digit PNR:</span>
          </div>
          <div className="pnr-input-container" style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="e.g. 4341029410"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, '').substring(0, 10))}
              className="search-input"
              style={{ height: '38px' }}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: '38px' }} disabled={loading}>
            Find Berth Vacancy
          </button>
        </form>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          className={`class-selector-btn ${searchMode === 'ROUTE' ? 'active' : ''}`}
          style={{ 
            background: searchMode === 'ROUTE' ? 'var(--accent-primary)' : '#f8f9fa', 
            color: searchMode === 'ROUTE' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid #ced4da',
            fontSize: '0.85rem',
            padding: '0.45rem 1rem'
          }}
          onClick={() => setSearchMode('ROUTE')}
        >
          Search by Route
        </button>
        <button
          type="button"
          className={`class-selector-btn ${searchMode === 'TRAIN' ? 'active' : ''}`}
          style={{ 
            background: searchMode === 'TRAIN' ? 'var(--accent-primary)' : '#f8f9fa', 
            color: searchMode === 'TRAIN' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid #ced4da',
            fontSize: '0.85rem',
            padding: '0.45rem 1rem'
          }}
          onClick={() => setSearchMode('TRAIN')}
        >
          Search by Train Number
        </button>
      </div>

      {/* Conditional Forms */}
      {searchMode === 'ROUTE' ? (
        <div>
          <h3 className="search-card-title">
            <Train size={18} />
            <span>Journey Planner (Route Search)</span>
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="search-grid">
              {/* From Station */}
              <div className="input-group" ref={fromRef}>
                <label className="input-label">Boarding Station</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. New Delhi or NDLS"
                    value={fromQuery}
                    onChange={(e) => {
                      setFromQuery(e.target.value);
                      setActiveInput('from');
                      if (fromStation) setFromStation(null);
                    }}
                    onFocus={() => setActiveInput('from')}
                    className="search-input"
                    required
                  />
                  {fromSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {fromSuggestions.map((station) => (
                        <div
                          key={station.code}
                          className="autocomplete-item"
                          onClick={() => handleStationSelect(station, 'from')}
                        >
                          <span className="autocomplete-station-name">{station.name}</span>
                          <span className="autocomplete-station-code">{station.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Button */}
              <div className="swap-container">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="btn-swap"
                  title="Swap Stations"
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>

              {/* To Station */}
              <div className="input-group" ref={toRef}>
                <label className="input-label">Destination Station</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Howrah or HWH"
                    value={toQuery}
                    onChange={(e) => {
                      setToQuery(e.target.value);
                      setActiveInput('to');
                      if (toStation) setToStation(null);
                    }}
                    onFocus={() => setActiveInput('to')}
                    className="search-input"
                    required
                  />
                  {toSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {toSuggestions.map((station) => (
                        <div
                          key={station.code}
                          className="autocomplete-item"
                          onClick={() => handleStationSelect(station, 'to')}
                        >
                          <span className="autocomplete-station-name">{station.name}</span>
                          <span className="autocomplete-station-code">{station.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Selector */}
              <div className="input-group">
                <label className="input-label">Date of Journey</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    value={date}
                    min={getTodayString()}
                    onChange={(e) => setDate(e.target.value)}
                    className="search-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checkbox for only searching trains */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', marginTop: '1rem' }}>
              <input
                type="checkbox"
                id="onlySearchTrains"
                checked={onlySearchTrains}
                onChange={(e) => setOnlySearchTrains(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="onlySearchTrains" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                Only search trains between stations (Get vacancy manually using train number)
              </label>
            </div>

            {/* Action buttons */}
            <div className="search-actions">
              {canStar && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(fromStation.code, toStation.code, fromStation.name, toStation.name)}
                  className="btn-secondary"
                  style={{ color: isStarred ? '#e0a256' : 'var(--accent-primary)', borderColor: isStarred ? '#e0a256' : 'var(--accent-primary)', gap: '0.4rem' }}
                >
                  <Star size={16} fill={isStarred ? '#e0a256' : 'none'} />
                  <span>{isStarred ? 'Starred Route' : 'Star Route'}</span>
                </button>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                <Search size={16} /> {loading ? 'Finding Trains...' : 'Search Train Charts'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <h3 className="search-card-title">
            <Train size={18} />
            <span>Journey Planner (Search by Train Number)</span>
          </h3>
          
          <form onSubmit={handleTrainSubmit}>
            <div className="search-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {/* Train Number Input */}
              <div className="input-group" style={{ position: 'relative' }}>
                <label className="input-label">Train Number / Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. 12302 or Rajdhani"
                    value={trainNumberQuery}
                    onChange={(e) => setTrainNumberQuery(e.target.value)}
                    className="search-input"
                    required
                  />
                  {trainSuggestions.length > 0 && trainNumberQuery.length < 5 && (
                    <div className="autocomplete-dropdown">
                      {trainSuggestions.map((train) => (
                        <div
                          key={train.number}
                          className="autocomplete-item"
                          onClick={() => {
                            setTrainNumberQuery(train.number);
                            setTrainSuggestions([]);
                          }}
                        >
                          <span className="autocomplete-station-name">{train.name}</span>
                          <span className="autocomplete-station-code">{train.number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Selector */}
              <div className="input-group">
                <label className="input-label">Date of Journey</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    value={date}
                    min={getTodayString()}
                    onChange={(e) => setDate(e.target.value)}
                    className="search-input"
                    required
                  />
                </div>
              </div>

              {/* Boarding Station Dropdown */}
              <div className="input-group">
                <label className="input-label">Boarding Station</label>
                <div className="input-wrapper">
                  {loadingSchedule ? (
                    <select
                      className="search-input"
                      disabled
                      style={{ height: '38px', padding: '0.4rem 0.65rem', background: '#f8f9fa', color: 'var(--text-muted)' }}
                    >
                      <option>Loading stations...</option>
                    </select>
                  ) : trainStations.length > 0 ? (
                    <select
                      className="search-input"
                      value={selectedBoarding}
                      onChange={(e) => setSelectedBoarding(e.target.value)}
                      style={{ height: '38px', padding: '0.4rem 0.65rem' }}
                      required
                    >
                      {trainStations.map((station) => (
                        <option key={station.code} value={station.code}>
                          {station.name} ({station.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="search-input"
                      disabled
                      style={{ height: '38px', padding: '0.4rem 0.65rem', background: '#f8f9fa', color: 'var(--text-muted)' }}
                    >
                      <option>
                        {trainNumberQuery.trim().length === 5 ? 'Check train number' : 'Select train to load stations'}
                      </option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="search-actions">
              {resolvedTrainName && (
                <div style={{ marginRight: 'auto', alignSelf: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  Selected: {resolvedTrainName} ({trainNumberQuery})
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={loading || trainStations.length === 0}>
                <Search size={16} /> {loading ? 'Fetching Chart...' : 'Get Train Chart'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Favorites bar */}
      {favorites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>SAVED ROUTES:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {favorites.map((fav, i) => (
              <button
                key={i}
                type="button"
                className="filter-pill"
                onClick={() => handleFavoriteClick(fav)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <Star size={11} fill="#e0a256" style={{ color: '#e0a256' }} />
                <span>{fav.from} ➔ {fav.to}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
