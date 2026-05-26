// src/components/TrainList.jsx
import React from 'react';
import { Train, Clock, CheckSquare, Square, Info } from 'lucide-react';

export default function TrainList({ trains, selectedTrainNumbers, onToggleSelectTrain, onSelectAll, onDeselectAll }) {
  if (trains.length === 0) {
    return (
      <div className="card-glass empty-state">
        <Info size={40} className="empty-icon" />
        <div className="empty-title">No Trains Found</div>
        <p>There are no scheduled trains for the selected route and date. Try selecting stations like NDLS to HWH or SBC to MAS.</p>
      </div>
    );
  }

  const allSelected = selectedTrainNumbers.length === trains.length;

  return (
    <div className="sidebar-panel">
      <div className="card-glass" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Trains on Route ({trains.length})</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {selectedTrainNumbers.length} selected
          </span>
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
            onClick={onDeselectAll}
          >
            Deselect All
          </button>
        </div>

        <div className="train-list-scroll-container">
          {trains.map((train) => {
            const isSelected = selectedTrainNumbers.includes(train.number);
            return (
              <div 
                key={train.number} 
                className={`train-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleSelectTrain(train.number)}
              >
                <div className="train-header">
                  <span className="train-num">{train.number}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      {train.classes.join(', ')}
                    </span>
                    {isSelected ? (
                      <CheckSquare size={16} style={{ color: 'var(--accent-secondary)' }} />
                    ) : (
                      <Square size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>
                
                <span className="train-name">{train.name}</span>
                
                <div className="train-times">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {train.depTime}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{train.duration}</span>
                  <span>{train.arrTime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
