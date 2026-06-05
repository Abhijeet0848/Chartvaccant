// src/components/CoachMap.jsx
import React, { useState, useEffect } from 'react';
import { UserCheck, Info, User } from 'lucide-react';

export default function CoachMap({ coachName, classCode, vacantBerths, activeBerthFilter, boarding, destination, pnrProfile, onBookSeat, trainNo, trainName }) {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [shakingSeat, setShakingSeat] = useState(null);
  const [occupiedMessage, setOccupiedMessage] = useState(null);

  // Clear states when coach or class changes
  useEffect(() => {
    setSelectedSeat(null);
    setShakingSeat(null);
    setOccupiedMessage(null);
  }, [coachName, classCode]);

  // Find if a seat is vacant
  const getVacantInfo = (berthNo) => {
    return vacantBerths.find(b => b.berthNo === berthNo);
  };

  const getBerthLabel = (type) => {
    switch (type) {
      case 'LB': return 'Lower (LB)';
      case 'MB': return 'Middle (MB)';
      case 'UB': return 'Upper (UB)';
      case 'SLB': return 'Side Lower (SLB)';
      case 'SUB': return 'Side Upper (SUB)';
      case 'WS': return 'Window Seat (WS)';
      case 'MS': return 'Middle Seat (MS)';
      case 'AS': return 'Aisle Seat (AS)';
      default: return type;
    }
  };

  const handleSeatClick = (seatNo, firstSegment) => {
    setSelectedSeat(prev => {
      if (prev && prev.berthNo === seatNo) {
        return null;
      }
      const segments = vacantBerths.filter(b => b.berthNo === seatNo);
      return {
        berthNo: seatNo,
        coach: coachName,
        berthType: firstSegment.berthType,
        segments
      };
    });
    setOccupiedMessage(null);
  };

  const handleOccupiedSeatClick = (seatNo) => {
    setShakingSeat(seatNo);
    setSelectedSeat(null);
    setOccupiedMessage(`Berth ${seatNo} is fully Booked / Occupied for this segment.`);
    setTimeout(() => {
      setShakingSeat(null);
    }, 400);
  };

  // Helper to determine if a seat belongs to the PNR profile
  const isPnrSeat = (seatNo) => {
    return pnrProfile && pnrProfile.coach === coachName && pnrProfile.berthNo === seatNo;
  };

  const getSeatClasses = (seatNo, vacantInfo) => {
    let classes = 'berth-seat ';
    if (vacantInfo) classes += 'vacant ';
    if (selectedSeat && selectedSeat.berthNo === seatNo) classes += 'selected-seat ';
    if (isPnrSeat(seatNo)) classes += 'pnr-owned-seat ';
    if (shakingSeat === seatNo) classes += 'shake ';
    return classes;
  };

  const getSeatTitle = (seatNo, vacantInfo) => {
    if (isPnrSeat(seatNo)) {
      return `Your Seat: Berth ${seatNo} (${pnrProfile.berthType}) - Booked under PNR ${pnrProfile.pnr}`;
    }
    if (vacantInfo) {
      const segments = vacantBerths.filter(b => b.berthNo === seatNo);
      const segmentStr = segments.map(seg => `${seg.from}➔${seg.to}`).join(', ');
      return `Berth ${seatNo} (${segments[0].berthType}) - Vacant: ${segmentStr}`;
    }
    return `Berth ${seatNo} (Occupied) - Click for details`;
  };

  // Render 3AC / Sleeper (72 capacity, 9 compartments of 8 berths)
  const render3ACOrSleeper = () => {
    const compartments = [];
    const totalCompartments = 9;

    for (let comp = 0; comp < totalCompartments; comp++) {
      const seats = [];
      const startSeat = comp * 8 + 1;

      for (let s = 0; s < 8; s++) {
        const seatNo = startSeat + s;
        const vacantInfo = getVacantInfo(seatNo);

        seats.push(
          <div
            key={seatNo}
            className={getSeatClasses(seatNo, vacantInfo)}
            style={{ gridRow: s < 6 ? Math.floor(s / 2) + 1 : 5, gridColumn: (s % 2) + 1 }}
            data-pos={s + 1}
            onClick={vacantInfo ? () => handleSeatClick(seatNo, vacantInfo) : () => handleOccupiedSeatClick(seatNo)}
            title={getSeatTitle(seatNo, vacantInfo)}
          >
            {isPnrSeat(seatNo) ? <User size={10} style={{ position: 'absolute', top: '2px' }} /> : null}
            {seatNo}
            <span style={{ fontSize: '0.55rem', opacity: 0.8, display: 'block', fontWeight: 400 }}>
              {isPnrSeat(seatNo) ? 'YOURS' : (vacantInfo ? vacantInfo.berthType : '')}
            </span>
          </div>
        );
      }

      compartments.push(
        <div key={comp} className="compartment">
          {seats}
          <div className="compartment-label">Bay {comp + 1}</div>
        </div>
      );
    }

    return <div className="compartments-grid">{compartments}</div>;
  };

  // Render 2AC (48 capacity, 8 compartments of 6 berths)
  const render2AC = () => {
    const compartments = [];
    const totalCompartments = 8;

    for (let comp = 0; comp < totalCompartments; comp++) {
      const seats = [];
      const startSeat = comp * 6 + 1;

      for (let s = 0; s < 6; s++) {
        const seatNo = startSeat + s;
        const vacantInfo = getVacantInfo(seatNo);

        seats.push(
          <div
            key={seatNo}
            className={getSeatClasses(seatNo, vacantInfo) + ' berth-seat-2a'}
            style={{ gridRow: s < 4 ? Math.floor(s / 2) + 1 : 4, gridColumn: (s % 2) + 1 }}
            data-pos={s + 1}
            onClick={vacantInfo ? () => handleSeatClick(seatNo, vacantInfo) : () => handleOccupiedSeatClick(seatNo)}
            title={getSeatTitle(seatNo, vacantInfo)}
          >
            {isPnrSeat(seatNo) ? <User size={10} style={{ position: 'absolute', top: '2px' }} /> : null}
            {seatNo}
            <span style={{ fontSize: '0.55rem', opacity: 0.8, display: 'block', fontWeight: 400 }}>
              {isPnrSeat(seatNo) ? 'YOURS' : (vacantInfo ? vacantInfo.berthType : '')}
            </span>
          </div>
        );
      }

      compartments.push(
        <div key={comp} className="compartment-2a">
          {seats}
          <div className="compartment-label" style={{ bottom: '8px' }}>Bay {comp + 1}</div>
        </div>
      );
    }

    return <div className="compartments-grid">{compartments}</div>;
  };

  // Render 1AC (24 capacity, 6 coupes of 4 berths)
  const render1AC = () => {
    const compartments = [];
    const totalCompartments = 6;

    for (let comp = 0; comp < totalCompartments; comp++) {
      const seats = [];
      const startSeat = comp * 4 + 1;

      for (let s = 0; s < 4; s++) {
        const seatNo = startSeat + s;
        const vacantInfo = getVacantInfo(seatNo);

        seats.push(
          <div
            key={seatNo}
            className={getSeatClasses(seatNo, vacantInfo)}
            style={{ gridRow: s < 2 ? s + 1 : s - 1, gridColumn: s < 2 ? 1 : 2, minHeight: '38px' }}
            onClick={vacantInfo ? () => handleSeatClick(seatNo, vacantInfo) : () => handleOccupiedSeatClick(seatNo)}
            title={getSeatTitle(seatNo, vacantInfo)}
          >
            {isPnrSeat(seatNo) ? <User size={10} style={{ position: 'absolute', top: '2px' }} /> : null}
            {seatNo}
            <span style={{ fontSize: '0.55rem', opacity: 0.8, display: 'block', fontWeight: 400 }}>
              {isPnrSeat(seatNo) ? 'YOURS' : (vacantInfo ? vacantInfo.berthType : '')}
            </span>
          </div>
        );
      }

      compartments.push(
        <div key={comp} className="compartment" style={{ gridTemplateRows: 'repeat(2, 38px) 10px repeat(2, 38px)', gridTemplateColumns: 'repeat(2, 45px)' }}>
          {seats}
          <div className="compartment-label">Cabin {String.fromCharCode(65 + comp)}</div>
        </div>
      );
    }

    return <div className="compartments-grid">{compartments}</div>;
  };

  // Render CC (Chair Car - 3+3 seating, 78 seats)
  const renderCC = () => {
    const rows = [];
    const totalRows = 13;

    for (let r = 0; r < totalRows; r++) {
      const seats = [];
      const startSeat = r * 6 + 1;
      const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

      for (let s = 0; s < 6; s++) {
        const seatNo = startSeat + s;
        const seatLabel = `${seatNo}${seatLetters[s]}`;
        const vacantInfo = getVacantInfo(seatNo);

        seats.push(
          <div
            key={seatNo}
            className={getSeatClasses(seatNo, vacantInfo)}
            style={{ 
              gridColumn: s < 3 ? s + 1 : s + 2,
              gridRow: 1,
              minHeight: '34px',
              fontSize: '0.7rem'
            }}
            onClick={vacantInfo ? () => handleSeatClick(seatNo, vacantInfo) : () => handleOccupiedSeatClick(seatNo)}
            title={getSeatTitle(seatNo, vacantInfo)}
          >
            {isPnrSeat(seatNo) ? <User size={8} style={{ position: 'absolute', top: '1px' }} /> : null}
            {seatLabel}
          </div>
        );
      }

      rows.push(
        <div 
          key={r} 
          className="compartment" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 34px) 14px repeat(3, 34px)',
            gridTemplateRows: '34px',
            minWidth: '260px',
            padding: '0.25rem 0.5rem',
            alignItems: 'center'
          }}
        >
          {seats}
          <div className="compartment-label" style={{ bottom: '-1px' }}>Row {r + 1}</div>
        </div>
      );
    }

    return <div className="compartments-grid" style={{ gap: '0.5rem' }}>{rows}</div>;
  };

  const getCoachLayout = () => {
    switch (classCode) {
      case '1A':
        return render1AC();
      case '2A':
        return render2AC();
      case 'CC':
      case 'EC':
        return renderCC();
      case '3A':
      case 'SL':
      default:
        return render3ACOrSleeper();
    }
  };

  return (
    <div className="coach-visualizer">
      {/* Coach Layout Card */}
      <div className="coach-container">
        <div className="coach-meta">
          <span>COACH: {coachName}</span>
          <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#ffffff' }}>
            CLASS: {classCode === 'SL' ? 'SLEEPER CLASS' : classCode}
          </span>
          <span>INDIAN RAILWAYS COACH COMPOSITION</span>
        </div>

        {getCoachLayout()}

        {/* Legend */}
        <div className="coach-legend">
          <div className="legend-item">
            <div className="legend-color occupied"></div>
            <span>Booked / Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-color vacant"></div>
            <span>Vacant (Available)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'var(--accent-primary)' }}></div>
            <span>Selected Berth</span>
          </div>
          {pnrProfile && (
            <div className="legend-item">
              <div className="legend-color" style={{ border: '2px dashed #007bff', background: 'rgba(0, 123, 255, 0.1)' }}></div>
              <span>Your Booked Berth</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Seat Details Info Card */}
      {occupiedMessage ? (
        <div className="badge-warning" style={{ margin: '1rem 0 0 0', width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
          <Info size={16} /> {occupiedMessage}
        </div>
      ) : selectedSeat ? (
        <div className="seat-detail-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', maxWidth: '600px' }}>
          <div className="seat-title" style={{ fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Coach {selectedSeat.coach} / Seat {selectedSeat.berthNo} ({getBerthLabel(selectedSeat.berthType)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectedSeat.segments.map((seg, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e9ecef', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Segment {sIdx + 1}:</span>
                  <span style={{ background: 'var(--color-vacant-bg)', color: 'var(--color-vacant)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                    {seg.from}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>➔</span>
                  <span style={{ background: 'var(--color-vacant-bg)', color: 'var(--color-vacant)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                    {seg.to}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onBookSeat({
                    ...seg,
                    trainNo,
                    trainName
                  })}
                  style={{
                    background: '#003399',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.3rem 0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Book Segment
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="badge-warning" style={{ margin: '1rem 0 0 0', width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center', background: '#fff3cd', borderColor: '#ffeeba', color: '#856404' }}>
          <Info size={16} /> Click any vacant (green) seat to view specific vacancy segment details.
        </div>
      )}

      {/* Compact List of Vacant Berths in this Coach */}
      {vacantBerths.length > 0 && (
        <div style={{ marginTop: '1.5rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-vacant)' }}></span>
            <span>Vacant Berth Segments in Coach {coachName} ({vacantBerths.length})</span>
          </h4>
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, borderBottom: '1px solid var(--border-color)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Berth No</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Type</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>From Station</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>To Station</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vacantBerths.map((b, idx) => (
                  <tr 
                    key={`${b.berthNo}-${b.from}-${b.to}-${idx}`} 
                    style={{ 
                      borderBottom: '1px solid #f1f3f5', 
                      background: selectedSeat && selectedSeat.berthNo === b.berthNo ? 'rgba(0, 51, 153, 0.05)' : 'transparent',
                      cursor: 'pointer' 
                    }}
                    onClick={() => handleSeatClick(b.berthNo, b)}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{b.berthNo}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{getBerthLabel(b.berthType)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: b.from === boarding ? 'var(--color-vacant)' : 'var(--text-primary)', fontWeight: b.from === boarding ? 700 : 400 }}>{b.from}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: b.to === destination ? 'var(--color-vacant)' : 'var(--text-primary)', fontWeight: b.to === destination ? 700 : 400 }}>{b.to}</td>
                    <td style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeatClick(b.berthNo, b);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: 0
                        }}
                      >
                        {selectedSeat && selectedSeat.berthNo === b.berthNo ? 'Selected' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookSeat({
                            ...b,
                            trainNo,
                            trainName
                          });
                        }}
                        style={{
                          background: '#003399',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.15rem 0.4rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Book
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
