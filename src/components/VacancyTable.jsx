// src/components/VacancyTable.jsx
import React, { useState } from 'react';
import { ArrowUpDown, HelpCircle } from 'lucide-react';

export default function VacancyTable({ berths, selectedClass, boarding, destination, onBookSeat }) {
  const [sortField, setSortField] = useState('trainNo');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Perform sorting
  const sortedBerths = [...berths].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Special numerical parsing for berthNo
    if (sortField === 'berthNo') {
      valA = parseInt(a.berthNo);
      valB = parseInt(b.berthNo);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

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

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('trainNo')} style={{ cursor: 'pointer' }}>
              Train <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
            </th>
            <th onClick={() => handleSort('coach')} style={{ cursor: 'pointer' }}>
              Coach <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
            </th>
            <th onClick={() => handleSort('berthNo')} style={{ cursor: 'pointer' }}>
              Berth / Seat <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
            </th>
            <th onClick={() => handleSort('berthType')} style={{ cursor: 'pointer' }}>
              Type <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
            </th>
            <th>Vacant From</th>
            <th>Vacant To</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedBerths.map((berth, index) => (
            <tr key={`${berth.trainNo}-${berth.coach}-${berth.berthNo}-${index}`}>
              <td>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{berth.trainNo}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{berth.trainName}</div>
              </td>
              <td>
                <strong style={{ color: 'var(--text-primary)' }}>{berth.coach}</strong>
              </td>
              <td>
                <strong style={{ color: 'var(--text-primary)' }}>{berth.berthNo}</strong>
              </td>
              <td>
                <span className="badge-berth-type">{getBerthLabel(berth.berthType)}</span>
              </td>
              <td>
                <span style={{ color: berth.from === boarding ? 'var(--color-vacant)' : 'var(--text-primary)', fontWeight: berth.from === boarding ? 700 : 400 }}>
                  {berth.from}
                </span>
              </td>
              <td>
                <span style={{ color: berth.to === destination ? 'var(--color-vacant)' : 'var(--text-primary)', fontWeight: berth.to === destination ? 700 : 400 }}>
                  {berth.to}
                </span>
              </td>
              <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ 
                  color: 'var(--color-vacant)', 
                  background: 'var(--color-vacant-bg)', 
                  border: '1px solid rgba(40, 167, 69, 0.25)',
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '0.2rem 0.4rem', 
                  borderRadius: '4px' 
                }}>
                  VACANT
                </span>
                <button
                  type="button"
                  onClick={() => onBookSeat(berth)}
                  style={{
                    background: '#003399',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.6rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    boxShadow: 'var(--shadow-sm)'
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
  );
}
