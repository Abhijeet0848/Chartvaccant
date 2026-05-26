// src/components/SearchForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, ArrowLeftRight, Search, Train, Star, FileText } from 'lucide-react';

export default function SearchForm({ onSearch, onPnrSearch, favorites = [], onToggleFavorite, isCurrentFavorite, loading }) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
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

  // Load suggestions
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
      date
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
    // We mock station object for input updates
    const fromObj = { code: fav.from, name: fav.fromName || fav.from };
    const toObj = { code: fav.to, name: fav.toName || fav.to };
    
    setFromStation(fromObj);
    setFromQuery(`${fromObj.name} (${fromObj.code})`);
    
    setToStation(toObj);
    setToQuery(`${toObj.name} (${toObj.code})`);
    
    onSearch({
      from: fav.from,
      to: fav.to,
      date
    });
  };

  // Helper to check if current route can be starred
  const canStar = fromStation && toStation;
  const isStarred = canStar && isCurrentFavorite(fromStation.code, toStation.code);

  return (
    <div className="card-glass search-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* PNR Quick Lookup Section */}
      <form onSubmit={handlePnrSubmit} className="pnr-form">
        <div className="pnr-label">
          <FileText size={18} />
          <span>Quick PNR Vacancy Lookup:</span>
        </div>
        <div className="pnr-input-container">
          <input
            type="text"
            placeholder="Enter 10-digit PNR (e.g. 4341029410)"
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, '').substring(0, 10))}
            className="search-input pnr-search-input"
            required
          />
        </div>
        <button type="submit" className="btn-secondary btn-pnr-submit" disabled={loading}>
          Find My Berth Vacancy
        </button>
      </form>

      {/* Route Search Form */}
      <form onSubmit={handleSubmit}>
        <div className="search-grid">
          {/* From Station */}
          <div className="input-group" ref={fromRef}>
            <label className="input-label">
              <MapPin size={14} className="logo-icon" /> Boarding Station
            </label>
            <div className="input-wrapper">
              <Train size={18} className="input-icon" />
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
              <ArrowLeftRight size={18} className="swap-icon" />
            </button>
          </div>

          {/* To Station */}
          <div className="input-group" ref={toRef}>
            <label className="input-label">
              <MapPin size={14} className="logo-icon" /> Destination Station
            </label>
            <div className="input-wrapper">
              <Train size={18} className="input-icon" />
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
            <label className="input-label">
              <Calendar size={14} className="logo-icon" /> Date of Journey
            </label>
            <div className="input-wrapper">
              <Calendar size={18} className="input-icon" />
              <input
                type="date"
                value={date}
                min={getTodayString()}
                onChange={(e) => setDate(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="search-actions">
          {canStar && (
            <button
              type="button"
              onClick={() => onToggleFavorite(fromStation.code, toStation.code, fromStation.name, toStation.name)}
              className="btn-secondary btn-star-route"
              style={{ color: isStarred ? 'var(--color-warning)' : 'var(--text-primary)', borderColor: isStarred ? 'var(--color-warning)' : 'var(--border-color)', gap: '0.4rem' }}
            >
              <Star size={16} fill={isStarred ? 'var(--color-warning)' : 'none'} />
              <span>{isStarred ? 'Starred Route' : 'Star Route'}</span>
            </button>
          )}

          <button type="submit" className="btn-primary btn-submit-search" disabled={loading}>
            <Search size={18} /> {loading ? 'Fetching Trains...' : 'Search Train Charts'}
          </button>
        </div>
      </form>

      {/* Favorites bar */}
      {favorites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAVED FAVORITE ROUTES:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {favorites.map((fav, i) => (
              <button
                key={i}
                type="button"
                className="filter-pill"
                onClick={() => handleFavoriteClick(fav)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem' }}
              >
                <Star size={12} fill="var(--color-warning)" style={{ color: 'var(--color-warning)' }} />
                <span>{fav.from} ➔ {fav.to}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
