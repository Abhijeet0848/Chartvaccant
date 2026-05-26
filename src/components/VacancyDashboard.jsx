// src/components/VacancyDashboard.jsx
import React, { useState } from 'react';
import { Eye, Train, SlidersHorizontal, Layers, CheckCircle2, AlertTriangle, Bell, BellOff, ArrowUpDown, ShieldCheck } from 'lucide-react';
import CoachMap from './CoachMap';
import VacancyTable from './VacancyTable';

export default function VacancyDashboard({
  trains,
  selectedTrainNumbers,
  vacanciesByTrain,
  selectedClass,
  setSelectedClass,
  loadingVacancy,
  searchParams,
  trackingCharts,
  onToggleTrackChart,
  pnrProfile
}) {
  const [activeBerthFilter, setActiveBerthFilter] = useState('ALL');
  const [expandedTrain, setExpandedTrain] = useState(null); // Train number that has coach map open
  const [activeCoachName, setActiveCoachName] = useState(null); // Active coach being viewed in map
  const [sortMethod, setSortMethod] = useState('TIME'); // 'TIME' or 'SEATS'

  const selectedTrains = trains.filter(t => selectedTrainNumbers.includes(t.number));

  if (selectedTrainNumbers.length === 0) {
    return (
      <div className="card-glass empty-state" style={{ minHeight: '350px' }}>
        <Eye size={48} className="empty-icon" />
        <div className="empty-title">Select Trains to Compare</div>
        <p>Choose one or more trains from the sidebar to display their chart vacancies simultaneously.</p>
      </div>
    );
  }

  // Get all unique classes available across selected trains
  const allAvailableClasses = Array.from(
    new Set(selectedTrains.flatMap(t => t.classes))
  ).sort();

  // If the currently selected class is not available in any selected train, select the first available one
  if (allAvailableClasses.length > 0 && !allAvailableClasses.includes(selectedClass)) {
    setSelectedClass(allAvailableClasses[0]);
  }

  // Check if any of the loaded train responses are warning about falling back to mock
  const warningList = Object.entries(vacanciesByTrain)
    .filter(([num, data]) => data && data.warning && selectedTrainNumbers.includes(num))
    .map(([num, data]) => ({ trainNo: num, warning: data.warning }));

  // Collect ALL vacant berths matching filters across all selected trains
  const allFilteredBerths = [];
  selectedTrains.forEach(train => {
    const vacancyData = vacanciesByTrain[train.number]?.data;
    if (!vacancyData || !vacancyData.vacantBerths) return;

    vacancyData.vacantBerths.forEach(berth => {
      // Filter by berth type
      if (activeBerthFilter !== 'ALL' && berth.berthType !== activeBerthFilter) {
        return;
      }
      
      allFilteredBerths.push({
        ...berth,
        trainNo: train.number,
        trainName: train.name
      });
    });
  });

  const handleRowExpand = (trainNo) => {
    if (expandedTrain === trainNo) {
      setExpandedTrain(null);
      setActiveCoachName(null);
    } else {
      setExpandedTrain(trainNo);
      // Auto select first coach
      const vacancyData = vacanciesByTrain[trainNo]?.data;
      if (vacancyData && vacancyData.coaches && vacancyData.coaches.length > 0) {
        setActiveCoachName(vacancyData.coaches[0].name);
      } else {
        setActiveCoachName(null);
      }
    }
  };

  const handleCoachSelect = (coachName) => {
    setActiveCoachName(coachName);
  };

  // Confirmation Chance / RAC Calculator
  const getRacChance = (vacantCount) => {
    if (vacantCount > 15) {
      return { pct: 95, label: 'High Confirm Chance', color: 'var(--color-vacant)' };
    } else if (vacantCount > 5) {
      return { pct: 75, label: 'Medium Confirm Chance', color: 'var(--color-warning)' };
    } else if (vacantCount > 0) {
      return { pct: 45, label: 'Low Confirm Chance', color: '#f87171' };
    } else {
      return { pct: 15, label: 'WL / Upgrade Unlikely', color: 'var(--text-muted)' };
    }
  };

  // Perform sorting on train rows
  const sortedTrains = [...selectedTrains].sort((a, b) => {
    if (sortMethod === 'SEATS') {
      const seatsA = vacanciesByTrain[a.number]?.data?.vacantBerths?.length || 0;
      const seatsB = vacanciesByTrain[b.number]?.data?.vacantBerths?.length || 0;
      return seatsB - seatsA; // Descending available seats
    }
    // Default: Sort by departure time
    return a.depTime.localeCompare(b.depTime);
  });

  const berthTypes = selectedClass === 'CC' 
    ? [
        { code: 'ALL', label: 'All Seats' },
        { code: 'WS', label: 'Window Seat (WS)' },
        { code: 'MS', label: 'Middle Seat (MS)' },
        { code: 'AS', label: 'Aisle Seat (AS)' }
      ]
    : [
        { code: 'ALL', label: 'All Berths' },
        { code: 'LB', label: 'Lower Berth (LB)' },
        { code: 'MB', label: 'Middle Berth (MB)' },
        { code: 'UB', label: 'Upper Berth (UB)' },
        { code: 'SLB', label: 'Side Lower (SLB)' },
        { code: 'SUB', label: 'Side Upper (SUB)' }
      ];

  return (
    <div className="main-panel">
      
      {/* PNR Notification Header */}
      {pnrProfile && (
        <div className="badge-warning" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-secondary)' }}>
          <ShieldCheck size={18} />
          <div style={{ flex: 1 }}>
            <strong>Active PNR Journey:</strong> Found train <strong>{pnrProfile.trainNo} ({pnrProfile.trainName})</strong> for passenger <strong>{pnrProfile.passengerName}</strong>. Assigned Berth: <strong>{pnrProfile.coach}-{pnrProfile.berthNo} ({pnrProfile.berthType})</strong>. Check seat map below to inspect nearby vacancies!
          </div>
        </div>
      )}

      {/* Fallback warnings */}
      {warningList.length > 0 && (
        <div className="badge-warning">
          <AlertTriangle size={16} />
          <div style={{ flex: 1 }}>
            <strong>IRCTC Live Connection Note:</strong> Some queries were blocked by Cloudflare/Akamai rate limits. Showing simulated backup data for trains: {warningList.map(w => w.trainNo).join(', ')}.
          </div>
        </div>
      )}

      {/* Unified Filters & Sorting Bar */}
      <div className="filter-bar">
        {/* Class selector */}
        <div className="filter-section">
          <span className="filter-title">
            <Layers size={14} style={{ marginRight: '4px' }} /> Travel Class:
          </span>
          <div className="filter-pills">
            {allAvailableClasses.map(cls => (
              <button
                key={cls}
                type="button"
                className={`filter-pill ${selectedClass === cls ? 'active' : ''}`}
                onClick={() => setSelectedClass(cls)}
              >
                {cls === 'SL' ? 'Sleeper (SL)' : cls}
              </button>
            ))}
          </div>
        </div>

        {/* Berth types selector */}
        <div className="filter-section">
          <span className="filter-title">
            <SlidersHorizontal size={14} style={{ marginRight: '4px' }} /> Berth Type:
          </span>
          <div className="filter-pills">
            {berthTypes.map(type => (
              <button
                key={type.code}
                type="button"
                className={`filter-pill ${activeBerthFilter === type.code ? 'active' : ''}`}
                onClick={() => setActiveBerthFilter(type.code)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting selector */}
        <div className="filter-section" style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
          <span className="filter-title">
            <ArrowUpDown size={14} style={{ marginRight: '4px' }} /> Sort Trains:
          </span>
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${sortMethod === 'TIME' ? 'active' : ''}`}
              onClick={() => setSortMethod('TIME')}
            >
              Departure Time (Early First)
            </button>
            <button
              type="button"
              className={`filter-pill ${sortMethod === 'SEATS' ? 'active' : ''}`}
              onClick={() => setSortMethod('SEATS')}
            >
              Available Seats (Most First)
            </button>
          </div>
        </div>
      </div>

      {/* Unified Stats Card */}
      <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="route-text">Boarding Route</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>{searchParams.from}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span>{searchParams.to}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: 400 }}>
              on {searchParams.date}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span className="route-text">Compared Trains</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
              {selectedTrains.length}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="route-text">Matching Vacancies</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-vacant)' }}>
              {loadingVacancy ? '...' : allFilteredBerths.length}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="comparison-container">
        {sortedTrains.map(train => {
          const trainVacancy = vacanciesByTrain[train.number];
          const vacancyData = trainVacancy?.data;
          const isLoading = loadingVacancy && !trainVacancy;
          const isChartPrepared = trainVacancy && trainVacancy.data && trainVacancy.data.coaches.length > 0;
          
          // Count vacant berths for this train
          const vacantCount = vacancyData?.vacantBerths 
            ? vacancyData.vacantBerths.filter(b => activeBerthFilter === 'ALL' || b.berthType === activeBerthFilter).length
            : 0;

          const isExpanded = expandedTrain === train.number;
          const isTracking = trackingCharts.includes(train.number);

          // Get RAC chance profile
          const racChance = getRacChance(vacantCount);

          return (
            <div key={train.number} className="train-comparison-row">
              {/* Row Header */}
              <div 
                className="train-comparison-row-header"
                style={{ cursor: isChartPrepared ? 'pointer' : 'default' }}
                onClick={isChartPrepared ? () => handleRowExpand(train.number) : undefined}
              >
                <div className="train-identity">
                  <div className="train-icon-box">
                    <Train size={20} />
                  </div>
                  <div className="train-name-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="train-row-num">{train.number}</span>
                      <span className="train-row-name">{train.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Departs {train.depTime} | Arrives {train.arrTime} ({train.duration})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* Chart check & notifier */}
                  {trainVacancy && trainVacancy.error ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        API ERROR: {trainVacancy.error}
                      </span>
                    </div>
                  ) : trainVacancy && !isChartPrepared ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        CHART NOT PREPARED
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTrackChart(train.number);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: '28px', color: isTracking ? 'var(--color-warning)' : 'var(--text-primary)', borderColor: isTracking ? 'var(--color-warning)' : 'var(--border-color)', gap: '0.25rem' }}
                      >
                        {isTracking ? <BellOff size={12} /> : <Bell size={12} />}
                        <span>{isTracking ? 'Tracking...' : 'Notify when Prepared'}</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* RAC Chance Gauge */}
                      {isChartPrepared && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }} title="RAC Upgrade / Cabin Confirmation Chance Estimate">
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIRM CHANCE</span>
                          <span style={{ color: racChance.color, fontWeight: 700 }}>
                            {racChance.pct}% ({racChance.label})
                          </span>
                        </div>
                      )}

                      {/* Vacancy Summary for selected class */}
                      <div className="train-vacancy-summary">
                        <div className="class-vacancy-badge">
                          <span className="class-label">{selectedClass}</span>
                          <span className={`class-count ${vacantCount === 0 ? 'zero' : ''}`}>
                            {isLoading ? '...' : vacantCount}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Warning/Source Badge */}
                  {trainVacancy && !trainVacancy.error && (
                    <span className="badge-source live">
                      Live IRCTC
                    </span>
                  )}

                  {isChartPrepared && (
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: isExpanded ? 'var(--accent-secondary)' : 'var(--border-color)' }}
                    >
                      {isExpanded ? 'Hide Layout' : 'View Coach Layout'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Coach Map & Coach list */}
              {isExpanded && vacancyData && isChartPrepared && (
                <div className="coach-section">
                  {vacancyData.coaches && vacancyData.coaches.length > 0 ? (
                    <>
                      {/* Tabs to select coach */}
                      <div className="coach-tabs">
                        {vacancyData.coaches.map(c => {
                          const coachVacancies = vacancyData.vacantBerths.filter(b => b.coach === c.name && (activeBerthFilter === 'ALL' || b.berthType === activeBerthFilter));
                          return (
                            <div
                              key={c.name}
                              className={`coach-tab ${activeCoachName === c.name ? 'active' : ''}`}
                              onClick={() => handleCoachSelect(c.name)}
                            >
                              {c.name} ({coachVacancies.length} vacant)
                            </div>
                          );
                        })}
                      </div>

                      {/* Coach Layout Visual Map */}
                      {activeCoachName && (
                        <CoachMap
                          coachName={activeCoachName}
                          classCode={selectedClass}
                          vacantBerths={vacancyData.vacantBerths.filter(b => b.coach === activeCoachName)}
                          activeBerthFilter={activeBerthFilter}
                          boarding={searchParams.from}
                          destination={searchParams.to}
                          pnrProfile={pnrProfile && pnrProfile.trainNo === train.number ? pnrProfile : null}
                        />
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                      No coaches available for class {selectedClass}.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid of ALL vacant seats matching filters */}
      {!loadingVacancy && allFilteredBerths.length > 0 && (
        <div className="card-glass" style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--color-vacant)' }} />
            <span>List of All Vacant Berths ({allFilteredBerths.length})</span>
          </h3>
          <VacancyTable 
            berths={allFilteredBerths} 
            selectedClass={selectedClass} 
            boarding={searchParams.from} 
            destination={searchParams.to} 
          />
        </div>
      )}
    </div>
  );
}
