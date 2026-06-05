// src/components/TrainList.jsx
import React from 'react';
import { Train, Clock, Info } from 'lucide-react';

export default function TrainList({ trains, selectedTrainNumbers, onToggleSelectTrain, onSelectAll, onDeselectAll, vacanciesByTrain = {} }) {
  if (trains.length === 0) {
    return (
      <div className="empty-state">
        <Info size={40} className="empty-icon" />
        <div className="empty-title">No Departures Found</div>
        <p>There are no scheduled trains for the selected route and date. Try selecting stations like NDLS to HWH or SBC to MAS.</p>
      </div>
    );
  }

  return (
    <div className="train-schedule-slider">
      <div className="train-schedule-header">
        <div className="train-schedule-title">
          <Train size={18} className="logo-icon" />
          <span>Departures Schedule ({trains.length} Trains)</span>
        </div>
        <div className="train-schedule-controls">
          <button 
            type="button" 
            className="filter-pill" 
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button 
            type="button" 
            className="filter-pill" 
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            onClick={onDeselectAll}
          >
            Clear Selected
          </button>
        </div>
      </div>

      <div className="train-timeline-container">
        {trains.map((train) => {
          const isSelected = selectedTrainNumbers.includes(train.number);
          
          // Calculate vacancy count if available
          const trainVacancy = vacanciesByTrain[train.number];
          const vacancyData = trainVacancy?.data;
          const vacantCount = vacancyData?.vacantBerths?.length;
          
          let vacancyLabel = 'Get Chart';
          let vacancyClass = 'check';
          
          if (trainVacancy) {
            if (trainVacancy.error) {
              vacancyLabel = 'Error';
              vacancyClass = 'none';
            } else if (vacancyData && vacancyData.coaches && vacancyData.coaches.length > 0) {
              vacancyLabel = `${vacantCount} Vacant`;
              vacancyClass = vacantCount > 15 ? 'high' : (vacantCount > 0 ? 'low' : 'none');
            } else {
              vacancyLabel = 'Not Prepared';
              vacancyClass = 'none';
            }
          }

          return (
            <div 
              key={train.number} 
              className={`train-ticket-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleSelectTrain(train.number)}
            >
              <div className="train-card-meta">
                <span className="train-ticket-num">{train.number}</span>
                <span className={`train-ticket-vacancy ${vacancyClass}`}>
                  {vacancyLabel}
                </span>
              </div>
              
              <div className="train-ticket-name">{train.name}</div>
              
              <div className="train-ticket-route">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} style={{ color: 'var(--accent-primary)' }} /> {train.depTime}
                </span>
                <span>{train.arrTime}</span>
              </div>
              
              <div className="train-ticket-duration">
                Duration: {train.duration} | {train.classes.join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
