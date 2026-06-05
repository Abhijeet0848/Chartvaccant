import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stations.json'), 'utf8')
);

const PREDEFINED_TRAINS = [
  // Delhi - Kolkata (NDLS - HWH)
  {
    number: '12302',
    name: 'Howrah Rajdhani Express',
    from: 'NDLS',
    to: 'HWH',
    depTime: '16:50',
    arrTime: '09:55',
    duration: '17h 05m',
    classes: ['1A', '2A', '3A'],
    route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'HWH'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun']
  },
  {
    number: '12314',
    name: 'Sealdah Rajdhani Express',
    from: 'NDLS',
    to: 'SDAH',
    depTime: '16:30',
    arrTime: '10:10',
    duration: '17h 40m',
    classes: ['1A', '2A', '3A'],
    route: ['NDLS', 'CNB', 'GAYA', 'DHN', 'SDAH'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    number: '12382',
    name: 'Poorva Express (via Gaya)',
    from: 'NDLS',
    to: 'HWH',
    depTime: '17:40',
    arrTime: '17:00',
    duration: '23h 20m',
    classes: ['1A', '2A', '3A', 'SL'],
    route: ['NDLS', 'ALJN', 'TDL', 'ETW', 'CNB', 'PRYJ', 'DDU', 'BBU', 'GAYA', 'DHN', 'ASN', 'HWH'],
    runsOn: ['Tue', 'Wed', 'Sat']
  },
  {
    number: '12304',
    name: 'Poorva Express (via Patna)',
    from: 'NDLS',
    to: 'HWH',
    depTime: '17:40',
    arrTime: '17:00',
    duration: '23h 20m',
    classes: ['1A', '2A', '3A', 'SL'],
    route: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'BXR', 'ARA', 'PNBE', 'KIUL', 'JSME', 'ASN', 'HWH'],
    runsOn: ['Sun', 'Mon', 'Thu', 'Fri']
  },
  {
    number: '12260',
    name: 'Sealdah Duronto Express',
    from: 'NDLS',
    to: 'SDAH',
    depTime: '19:40',
    arrTime: '12:45',
    duration: '17h 05m',
    classes: ['1A', '2A', '3A'],
    route: ['NDLS', 'CNB', 'DDU', 'DHN', 'SDAH'],
    runsOn: ['Mon', 'Tue', 'Thu', 'Fri']
  },

  // Delhi - Mumbai (NDLS - CSMT / MMCT)
  {
    number: '12952',
    name: 'Mumbai Central Rajdhani Express',
    from: 'NDLS',
    to: 'MMCT',
    depTime: '16:55',
    arrTime: '08:35',
    duration: '15h 40m',
    classes: ['1A', '2A', '3A'],
    route: ['NDLS', 'KOTA', 'RTM', 'BRC', 'BVI', 'MMCT'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    number: '12954',
    name: 'August Kranti Rajdhani Express',
    from: 'NZM',
    to: 'MMCT',
    depTime: '17:15',
    arrTime: '10:05',
    duration: '16h 50m',
    classes: ['1A', '2A', '3A'],
    route: ['NZM', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'MMCT'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    number: '12926',
    name: 'Paschim Express',
    from: 'NDLS',
    to: 'BDTS',
    depTime: '16:35',
    arrTime: '14:55',
    duration: '22h 20m',
    classes: ['1A', '2A', '3A', 'SL'],
    route: ['NDLS', 'FDB', 'MTJ', 'SWM', 'KOTA', 'RTM', 'BRC', 'ST', 'VAPI', 'BVI', 'BDTS'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },

  // Bangalore - Chennai (SBC - MAS)
  {
    number: '12008',
    name: 'Mysuru - Chennai Central Shatabdi Express',
    from: 'SBC',
    to: 'MAS',
    depTime: '16:25',
    arrTime: '21:30',
    duration: '5h 05m',
    classes: ['CC', 'EC'],
    route: ['SBC', 'KJM', 'JTJ', 'KPD', 'AJJ', 'MAS'],
    runsOn: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    number: '22626',
    name: 'KSR Bengaluru - MGR Chennai Central Double Decker Express',
    from: 'SBC',
    to: 'MAS',
    depTime: '14:30',
    arrTime: '20:30',
    duration: '6h 00m',
    classes: ['CC'],
    route: ['SBC', 'BNC', 'KJM', 'BWT', 'JTJ', 'KPD', 'AJJ', 'PER', 'MAS'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    number: '12640',
    name: 'Brindavan Express',
    from: 'SBC',
    to: 'MAS',
    depTime: '15:10',
    arrTime: '21:10',
    duration: '6h 00m',
    classes: ['CC', 'SL'],
    route: ['SBC', 'BNC', 'KJM', 'BWT', 'KPN', 'JTJ', 'KPD', 'WJR', 'AJJ', 'TRL', 'PER', 'MAS'],
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }
];

// Helper to check if a train runs on a specific day of week
function runsOnDay(runsOn, dateStr) {
  const date = new Date(dateStr);
  const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon...
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[dayIndex];
  return runsOn.includes(dayName);
}

// Generate coach configurations
const COACH_CONFIGS = {
  '1A': { prefix: 'H', capacity: 24, berths: ['LB', 'UB'] },
  '2A': { prefix: 'A', capacity: 48, berths: ['LB', 'UB', 'SLB', 'SUB'] },
  '3A': { prefix: 'B', capacity: 72, berths: ['LB', 'MB', 'UB', 'SLB', 'SUB'] },
  'CC': { prefix: 'C', capacity: 78, berths: ['WS', 'MS', 'AS'] }, // Window, Middle, Aisle
  'SL': { prefix: 'S', capacity: 72, berths: ['LB', 'MB', 'UB', 'SLB', 'SUB'] }
};

// Generates berths for standard layout types
function getBerthType(berthIndex, classCode) {
  if (classCode === 'CC') {
    // 3+3 seating layout
    const seatType = berthIndex % 6;
    if (seatType === 0 || seatType === 5) return 'WS'; // Window
    if (seatType === 1 || seatType === 4) return 'MS'; // Middle
    return 'AS'; // Aisle
  }
  
  if (classCode === '2A') {
    // 4 + 2 layout
    const cycle = berthIndex % 6;
    if (cycle === 1 || cycle === 3) return 'LB';
    if (cycle === 2 || cycle === 4) return 'UB';
    if (cycle === 5) return 'SLB';
    return 'SUB';
  }
  
  if (classCode === '1A') {
    // Cabin-coupe style: alternating lower/upper
    return berthIndex % 2 === 1 ? 'LB' : 'UB';
  }

  // 3A and SL layouts: 8 berths per compartment (6 inside, 2 side)
  const cycle = berthIndex % 8;
  if (cycle === 1 || cycle === 4) return 'LB';
  if (cycle === 2 || cycle === 5) return 'MB';
  if (cycle === 3 || cycle === 6) return 'UB';
  if (cycle === 7) return 'SLB';
  return 'SUB'; // 0 or 8
}

// Generate a random schedule between station pairs if none exists
function generateDynamicTrain(from, to, dateStr, seedIndex) {
  const trainNumber = String(10000 + Math.floor(Math.abs(Math.sin(seedIndex) * 90000)));
  const types = ['Express', 'Superfast', 'Humsafar', 'Duronto', 'Shatabdi', 'Garib Rath'];
  const type = types[Math.floor(Math.abs(Math.sin(seedIndex + 1)) * types.length)];
  const name = `${STATIONS.find(s => s.code === from)?.city || from} - ${STATIONS.find(s => s.code === to)?.city || to} ${type}`;
  
  const hour = Math.floor(Math.abs(Math.sin(seedIndex + 2)) * 24);
  const minute = Math.floor(Math.abs(Math.sin(seedIndex + 3)) * 60);
  const depTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  
  const durHours = Math.floor(Math.abs(Math.sin(seedIndex + 4)) * 18) + 4;
  const durMinutes = Math.floor(Math.abs(Math.sin(seedIndex + 5)) * 60);
  const duration = `${durHours}h ${durMinutes}m`;
  
  const arrHour = (hour + durHours + Math.floor((minute + durMinutes) / 60)) % 24;
  const arrMin = (minute + durMinutes) % 60;
  const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
  
  const classes = ['3A', 'SL', '2A'];
  if (type === 'Shatabdi') {
    return {
      number: trainNumber,
      name,
      from,
      to,
      depTime,
      arrTime,
      duration,
      classes: ['CC', 'EC'],
      route: [from, to],
      runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };
  }

  return {
    number: trainNumber,
    name,
    from,
    to,
    depTime,
    arrTime,
    duration,
    classes,
    route: [from, 'CNB', 'BPL', to], // Generic midpoint route
    runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };
}

function getStations(query) {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return STATIONS.filter(s => 
    s.code.toLowerCase().includes(lowerQuery) || 
    s.name.toLowerCase().includes(lowerQuery) ||
    s.city.toLowerCase().includes(lowerQuery)
  );
}

function getTrainsBetween(from, to, dateStr) {
  // Find stations
  const fromStation = STATIONS.find(s => s.code === from);
  const toStation = STATIONS.find(s => s.code === to);
  if (!fromStation || !toStation) return [];

  // Filter predefined trains
  let matched = PREDEFINED_TRAINS.filter(train => {
    // Check if train routes covers both from and to
    const fromIndex = train.route.indexOf(from);
    const toIndex = train.route.indexOf(to);
    return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
  });

  // If no predefined trains matched, dynamically generate 3-4 realistic trains
  if (matched.length === 0) {
    const count = 3 + Math.floor((Math.abs(Math.sin(from.charCodeAt(0) + to.charCodeAt(0))) * 3));
    for (let i = 0; i < count; i++) {
      matched.push(generateDynamicTrain(from, to, dateStr, i));
    }
  }

  // Assign route timings and return
  return matched.map(train => {
    // Filter out run on date
    return {
      ...train,
      boardingStation: from,
      destinationStation: to,
      date: dateStr
    };
  });
}

function getVacancy(trainNo, boarding, destination, classCode, dateStr) {
  // Find the train details
  let train = PREDEFINED_TRAINS.find(t => t.number === trainNo);
  if (!train) {
    // Generate dynamically based on train number
    train = generateDynamicTrain(boarding, destination, dateStr, parseInt(trainNo) || 0);
    train.number = trainNo;
  }

  const config = COACH_CONFIGS[classCode] || COACH_CONFIGS['3A'];
  
  // Determine how many coaches (e.g. S1-S8, B1-B10, A1-A5, H1-H2, etc)
  let coachCount = 3;
  if (classCode === 'SL') coachCount = 8;
  if (classCode === '3A') coachCount = 10;
  if (classCode === '2A') coachCount = 5;
  if (classCode === '1A') coachCount = 2;

  const coaches = [];
  const vacantBerths = [];

  // Seed randomness using trainNo, classCode, date
  let seed = 0;
  for (let i = 0; i < trainNo.length; i++) seed += trainNo.charCodeAt(i);
  for (let i = 0; i < classCode.length; i++) seed += classCode.charCodeAt(i);
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);

  // Dynamic generation
  for (let c = 1; c <= coachCount; c++) {
    const coachName = `${config.prefix}${c}`;
    coaches.push({
      name: coachName,
      classCode,
      capacity: config.capacity
    });

    // Generate vacant berths for this coach
    // Let's say ~10% to 25% of seats are vacant after charting
    const vacancyRate = 0.05 + ((seed % 15) / 100); // 5% to 20%
    const vacantCount = Math.floor(config.capacity * vacancyRate);
    
    const usedBerths = new Set();
    for (let v = 0; v < vacantCount; v++) {
      // Pick a unique seat index
      let seatIndex;
      let attempts = 0;
      do {
        seatIndex = 1 + (Math.floor(Math.abs(Math.sin(seed + c + v + attempts) * config.capacity)));
        attempts++;
      } while (usedBerths.has(seatIndex) && attempts < 100);

      if (usedBerths.has(seatIndex)) continue;
      usedBerths.add(seatIndex);

      const berthType = getBerthType(seatIndex, classCode);
      
      // Dynamic subsegment vacancy (e.g. seat is vacant for whole journey, or only a portion)
      let subFrom = boarding;
      let subTo = destination;
      
      // Define subsegments if route is long (predefined)
      if (train.route && train.route.length > 2) {
        const fromIdx = train.route.indexOf(boarding);
        const toIdx = train.route.indexOf(destination);
        
        if (fromIdx !== -1 && toIdx !== -1 && toIdx - fromIdx > 1) {
          // Sometime vacant only for a subset
          const rand = Math.sin(seed + seatIndex) * 100;
          if (rand > 60 && toIdx - fromIdx > 2) {
            subFrom = train.route[fromIdx];
            subTo = train.route[fromIdx + 2];
          } else if (rand > 30) {
            subFrom = train.route[fromIdx + 1];
            subTo = train.route[toIdx];
          }
        }
      }

      vacantBerths.push({
        coach: coachName,
        berthNo: seatIndex,
        berthType: berthType,
        from: subFrom,
        to: subTo,
        class: classCode
      });
    }
  }

  // Sort vacant berths
  vacantBerths.sort((a, b) => {
    if (a.coach !== b.coach) return a.coach.localeCompare(b.coach);
    return a.berthNo - b.berthNo;
  });

  return {
    trainNumber: trainNo,
    trainName: train.name,
    boarding,
    destination,
    classCode,
    coaches,
    vacantBerths
  };
}

export {
  STATIONS,
  PREDEFINED_TRAINS,
  getStations,
  getTrainsBetween,
  getVacancy
};
