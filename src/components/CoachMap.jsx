// src/components/CoachMap.jsx
import React, { useState, useEffect } from 'react';
import { UserCheck, Info, User } from 'lucide-react';

export default function CoachMap({ coachName, classCode, vacantBerths, activeBerthFilter, boarding, destination, pnrProfile }) {
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Clear selected seat when coach or class changes
  useEffect(() => {
    setSelectedSeat(null);
  }, [coachName, classCode]);

  // Find if a seat is vacant
  const getVacantInfo = (berthNo) => {
    return vacantBerths.find(b => b.berthNo === berthNo);
  };

  const handleSeatClick = (seatInfo) => {
    if (selectedSeat && selectedSeat.berthNo === seatInfo.berthNo) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seatInfo);
    }
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
    return classes;
  };

  const getSeatTitle = (seatNo, vacantInfo) => {
    if (isPnrSeat(seatNo)) {
      return `Your Seat: Berth ${seatNo} (${pnrProfile.berthType}) - Booked under PNR ${pnrProfile.pnr}`;
    }
    if (vacantInfo) {
      return `Berth ${seatNo} (${vacantInfo.berthType}) - Vacant from ${vacantInfo.from} to ${vacantInfo.to}`;
    }
    return `Berth ${seatNo} (Occupied)`;
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
        const isSelected = selectedSeat && selectedSeat.berthNo === seatNo;

        seats.push(
          <div
            key={seatNo}
            className={getSeatClasses(seatNo, vacantInfo)}
            data-pos={s + 1}
            onClick={vacantInfo ? () => handleSeatClick(vacantInfo) : undefined}
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
            className={`berth-seat berth-seat-2a ${vacantInfo ? 'vacant' : ''} ${selectedSeat && selectedSeat.berthNo === seatNo ? 'selected-seat' : ''} ${isPnrSeat(seatNo) ? 'pnr-owned-seat' : ''}`}
            data-pos={s + 1}
            onClick={vacantInfo ? () => handleSeatClick(vacantInfo) : undefined}
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
            className={`berth-seat ${vacantInfo ? 'vacant' : ''} ${selectedSeat && selectedSeat.berthNo === seatNo ? 'selected-seat' : ''} ${isPnrSeat(seatNo) ? 'pnr-owned-seat' : ''}`}
            style={{ gridRow: s < 2 ? s + 1 : s - 1, gridColumn: s < 2 ? 1 : 2, minHeight: '38px' }}
            onClick={vacantInfo ? () => handleSeatClick(vacantInfo) : undefined}
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
            className={`berth-seat ${vacantInfo ? 'vacant' : ''} ${selectedSeat && selectedSeat.berthNo === seatNo ? 'selected-seat' : ''} ${isPnrSeat(seatNo) ? 'pnr-owned-seat' : ''}`}
            style={{ 
              gridColumn: s < 3 ? s + 1 : s + 2,
              gridRow: 1,
              minHeight: '34px',
              fontSize: '0.7rem'
            }}
            onClick={vacantInfo ? () => handleSeatClick(vacantInfo) : undefined}
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
        <div className="coach-inner-shadow"></div>
        <div className="coach-meta">
          <span>COACH: {coachName}</span>
          <span>CLASS: {classCode === 'SL' ? 'SLEEPER' : classCode}</span>
          <span>INDIAN RAILWAYS COACH COMPOSITION</span>
        </div>

        {getCoachLayout()}

        {/* Legend */}
        <div className="coach-legend" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="legend-item">
            <div className="legend-color occupied"></div>
            <span>Booked / Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-color vacant"></div>
            <span>Vacant (Available)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'var(--accent-secondary)' }}></div>
            <span>Selected Berth</span>
          </div>
          {pnrProfile && (
            <div className="legend-item">
              <div className="legend-color" style={{ border: '2px dashed var(--color-warning)', background: 'rgba(245, 158, 11, 0.2)', boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}></div>
              <span>Your Booked Berth</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Seat Details Info Card */}
      {selectedSeat ? (
        <div className="seat-detail-card">
          <div className="seat-detail-info">
            <div className="seat-title">
              Coach {selectedSeat.coach} / Seat {selectedSeat.berthNo} ({selectedSeat.berthType})
            </div>
            <div className="seat-route">
              Vacant Segment: <strong style={{ color: 'var(--color-vacant)' }}>{selectedSeat.from}</strong> to <strong style={{ color: 'var(--color-vacant)' }}>{selectedSeat.to}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <UserCheck size={16} /> Available
          </div>
        </div>
      ) : (
        <div className="badge-warning" style={{ margin: '1rem 0 0 0', width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          <Info size={16} /> Click any vacant (green) seat to view specific vacancy segment details.
        </div>
      )}
    </div>
  );
}
