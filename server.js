// server.js
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import * as mockData from './services/mockData.js';

// MongoDB Database Connection & Models
import mongoose from 'mongoose';
import './services/db.js';
import User from './models/User.js';
import Booking from './models/Booking.js';
import Train from './models/Train.js';
import Station from './models/Station.js';

// Configure Proxy if defined
const proxyUrl = process.env.PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  try {
    console.log(`[Proxy] Configuring global ProxyAgent using: ${proxyUrl}`);
    const proxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(proxyAgent);
  } catch (err) {
    console.error(`[Proxy] Failed to configure ProxyAgent: ${err.message}`);
  }
}


function generateRandomHexString(length = 32) {
  return crypto.randomBytes(length / 2).toString('hex');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' https://*.confirmtkt.com https://*.irctc.co.in; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;");
  next();
});

// Memory-based Rate Limiter (Max 100 requests per IP per minute)
const rateLimitWindowMs = 60 * 1000;
const rateLimitMaxRequests = 100;
const ipRequestCounts = new Map();

setInterval(() => {
  ipRequestCounts.clear();
}, rateLimitWindowMs);

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const current = ipRequestCounts.get(ip) || 0;
    if (current >= rateLimitMaxRequests) {
      return res.status(429).json({ status: 'error', message: 'Too many requests. Please try again after a minute.' });
    }
    ipRequestCounts.set(ip, current + 1);
  }
  next();
});

// Validators & Regular Expressions
const stationRegex = /^[A-Z]{3,6}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const pnrRegex = /^\d{10}$/;
const trainNoRegex = /^\d{5}$/;
const validClasses = ['1A', '2A', '3A', 'CC', 'EC', 'SL', '3E', '2S'];

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


// Endpoint 1: Station Autocomplete
app.get('/api/stations', async (req, res) => {
  try {
    const query = String(req.query.q || '').slice(0, 50).trim();
    if (!query) {
      return res.json({ status: 'success', data: [] });
    }
    // Alphanumeric search queries only
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, '');
    const regex = new RegExp('^' + cleanQuery, 'i');
    const regexAnywhere = new RegExp(cleanQuery, 'i');

    const results = await Station.find({
      $or: [
        { code: regex },
        { name: regexAnywhere },
        { city: regexAnywhere }
      ]
    }).limit(15);

    res.json({ status: 'success', data: results });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Endpoint 2: Train Search
app.post('/api/trains', async (req, res) => {
  const { from, to, date } = req.body;
  if (!from || !to || !date) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters: from, to, date are required.' });
  }

  // Input Validation
  if (!stationRegex.test(from) || !stationRegex.test(to)) {
    return res.status(400).json({ status: 'error', message: 'Invalid station code format. Expected 3-6 uppercase letters.' });
  }
  if (!dateRegex.test(date)) {
    return res.status(400).json({ status: 'error', message: 'Invalid date format. Expected yyyy-mm-dd.' });
  }

  try {
    // Format date from yyyy-mm-dd to dd-mm-yyyy for ConfirmTkt API
    const [yyyy, mm, dd] = date.split('-');
    const doj = `${dd}-${mm}-${yyyy}`;

    const params = new URLSearchParams({
      fromStnCode: from,
      destStnCode: to,
      doj: doj,
      quota: 'GN',
      token: generateRandomHexString(64),
      androidid: '',
      travelClassOrdering: 'ON,Ixigo',
      appVersion: '397',
      prevBookedTrains: 'OFF',
      noChancePercentage: 'true',
      getNearbyStation: 'true',
      session: generateRandomHexString(32)
    });

    const response = await fetch(`https://securedapi.confirmtkt.com/api/platform/trainbooking/tatwnstns?${params.toString()}`, {
      headers: {
        'Host': 'securedapi.confirmtkt.com',
        'Connection': 'Keep-Alive',
        'User-Agent': 'okhttp/4.9.2'
      }
    });

    if (!response.ok) {
      throw new Error(`ConfirmTkt API returned status: ${response.status}`);
    }

    const json = await response.json();
    const trains = (json.trainBtwnStnsList || []).map(train => {
      const durationParts = (train.duration || '').split(':');
      const formattedDuration = durationParts.length === 2 
        ? `${durationParts[0]}h ${durationParts[1]}m` 
        : train.duration;

      const runsOn = [];
      if (train.runningMon === 'Y') runsOn.push('Mon');
      if (train.runningTue === 'Y') runsOn.push('Tue');
      if (train.runningWed === 'Y') runsOn.push('Wed');
      if (train.runningThu === 'Y') runsOn.push('Thu');
      if (train.runningFri === 'Y') runsOn.push('Fri');
      if (train.runningSat === 'Y') runsOn.push('Sat');
      if (train.runningSun === 'Y') runsOn.push('Sun');

      return {
        number: train.trainNumber,
        name: train.trainName,
        from: train.fromStnCode,
        to: train.toStnCode,
        depTime: train.departureTime,
        arrTime: train.arrivalTime,
        duration: formattedDuration,
        classes: train.avlClasses?.Array || ['SL', '3A', '2A'],
        runsOn: runsOn.length > 0 ? runsOn : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        boardingStation: from,
        destinationStation: to,
        date: date
      };
    });

     res.json({ status: 'success', source: 'live', data: trains });
  } catch (err) {
    console.warn(`Real-time train fetch failed: ${err.message}.`);
    if (process.env.STRICT_REALTIME === 'true') {
      return res.status(502).json({ status: 'error', message: `Real-time train fetch failed: ${err.message}` });
    }
    console.warn('Falling back to MongoDB mock data.');
    try {
      let dbTrains = await Train.find({ route: { $all: [from, to] } });
      dbTrains = dbTrains.filter(t => {
        const fromIdx = t.route.indexOf(from);
        const toIdx = t.route.indexOf(to);
        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
      });

      let trains = dbTrains.map(t => ({
        number: t.number,
        name: t.name,
        from: t.from,
        to: t.to,
        depTime: t.depTime,
        arrTime: t.arrTime,
        duration: t.duration,
        classes: t.classes,
        runsOn: t.runsOn,
        boardingStation: from,
        destinationStation: to,
        date: date
      }));

      if (trains.length === 0) {
        trains = mockData.getTrainsBetween(from, to, date);
      }
      res.json({ status: 'success', source: 'simulated', data: trains, warning: `Live fetch failed: ${err.message}. Showing simulated trains.` });
    } catch (dbErr) {
      console.error('MongoDB Train fetch failed:', dbErr);
      const trains = mockData.getTrainsBetween(from, to, date);
      res.json({ status: 'success', source: 'simulated', data: trains, warning: `Live fetch failed. Showing simulated trains.` });
    }
  }
});

// Endpoint 3: PNR Decoder Lookup
function getBerthType(berthNo, classCode) {
  if (!berthNo) return null;
  if (classCode === 'CC') {
    const seatType = berthNo % 6;
    if (seatType === 0 || seatType === 5) return 'WS';
    if (seatType === 1 || seatType === 4) return 'MS';
    return 'AS';
  }
  if (classCode === '2A') {
    const cycle = berthNo % 6;
    if (cycle === 1 || cycle === 3) return 'LB';
    if (cycle === 2 || cycle === 4) return 'UB';
    if (cycle === 5) return 'SLB';
    return 'SUB';
  }
  if (classCode === '1A') {
    return berthNo % 2 === 1 ? 'LB' : 'UB';
  }
  const cycle = berthNo % 8;
  if (cycle === 1 || cycle === 4) return 'LB';
  if (cycle === 2 || cycle === 5) return 'MB';
  if (cycle === 3 || cycle === 6) return 'UB';
  if (cycle === 7) return 'SLB';
  return 'SUB';
}

// Endpoint 3: PNR Decoder Lookup
app.post('/api/pnr', async (req, res) => {
  const { pnr } = req.body;
  if (!pnr) {
    return res.status(400).json({ status: 'error', message: 'Missing PNR parameter.' });
  }

  // Input Validation
  if (!pnrRegex.test(pnr)) {
    return res.status(400).json({ status: 'error', message: 'Invalid PNR. Please enter a 10-digit numeric value.' });
  }

  try {
    const url = `https://api.confirmtkt.com/api/pnr/status/${pnr}`;
    const params = new URLSearchParams({
      session: generateRandomHexString(32)
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Host': 'api.confirmtkt.com',
        'Connection': 'Keep-Alive',
        'User-Agent': 'okhttp/4.9.2'
      }
    });

    if (!response.ok) {
      throw new Error(`ConfirmTkt PNR API returned status: ${response.status}`);
    }

    const json = await response.json();

    if (!json.TrainNo || json.Error || json.ErrorCode) {
      throw new Error(json.Error || 'Invalid PNR number or details not found on server.');
    }

    // Convert date format from Doj (dd-MM-yyyy or similar) to yyyy-mm-dd
    let formattedDate = json.Doj;
    if (json.Doj && json.Doj.includes('-')) {
      const parts = json.Doj.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          formattedDate = json.Doj;
        } else {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    let coach = null;
    let berthNo = null;
    let berthType = null;
    let passengerName = 'Passenger 1';

    if (json.PassengerStatus && json.PassengerStatus.length > 0) {
      const pass = json.PassengerStatus[0];
      coach = pass.Coach || null;
      berthNo = pass.Berth ? parseInt(pass.Berth) : null;
      
      const statusStr = pass.CurrentStatus || pass.BookingStatus || '';
      if (statusStr.includes('/')) {
        const parts = statusStr.split('/');
        if (!coach && parts[1]) coach = parts[1];
        if (!berthNo && parts[2]) berthNo = parseInt(parts[2]);
        if (!berthType && parts[3]) berthType = parts[3];
      }
      
      if (berthNo && !berthType) {
        berthType = getBerthType(berthNo, json.Class);
      }
    }

    const pnrProfile = {
      pnr: json.Pnr || pnr,
      trainNo: json.TrainNo,
      trainName: json.TrainName,
      date: formattedDate,
      classCode: json.Class || '3A',
      from: json.BoardingPoint || json.From,
      to: json.ReservationUpto || json.To,
      coach: coach || 'B1',
      berthNo: berthNo || 33,
      berthType: berthType || 'UB',
      passengerName: passengerName
    };

     res.json({ status: 'success', source: 'live', data: pnrProfile });
  } catch (err) {
    console.warn(`Real-time PNR lookup failed: ${err.message}.`);
    if (process.env.STRICT_REALTIME === 'true') {
      return res.status(502).json({ status: 'error', message: `Real-time PNR lookup failed: ${err.message}` });
    }
    console.warn('Falling back to mock profile.');
    
    // Fallback deterministic profile generator
    let digitSum = 0;
    for (let i = 0; i < pnr.length; i++) {
      digitSum += parseInt(pnr[i]) || 0;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let pnrProfile = {};

    const lastDigit = parseInt(pnr[9]) || 0;
    if (lastDigit % 3 === 0) {
      pnrProfile = {
        pnr,
        trainNo: '12302',
        trainName: 'Howrah Rajdhani Express',
        date: todayStr,
        classCode: '3A',
        from: 'NDLS',
        to: 'HWH',
        coach: 'B1',
        berthNo: 33,
        berthType: 'UB',
        passengerName: 'Passenger 1'
      };
    } else if (lastDigit % 3 === 1) {
      pnrProfile = {
        pnr,
        trainNo: '12952',
        trainName: 'Mumbai Rajdhani Express',
        date: todayStr,
        classCode: '2A',
        from: 'NDLS',
        to: 'MMCT',
        coach: 'A1',
        berthNo: 12,
        berthType: 'UB',
        passengerName: 'Passenger 2'
      };
    } else {
      pnrProfile = {
        pnr,
        trainNo: '12640',
        trainName: 'Brindavan Express',
        date: todayStr,
        classCode: 'SL',
        from: 'SBC',
        to: 'MAS',
        coach: 'S2',
        berthNo: 24,
        berthType: 'UB',
        passengerName: 'Passenger 3'
      };
    }

    res.json({ 
      status: 'success', 
      source: 'simulated',
      data: pnrProfile,
      warning: `PNR live query failed: ${err.message}. Showing simulated data.` 
    });
  }
});

// Endpoint 4: Train Chart Vacancy details (Realtime Endpoint)
app.post('/api/vacancy', async (req, res) => {
  const { trainNo, boarding, destination, classCode, date } = req.body;

  if (!trainNo || !boarding || !destination || !classCode || !date) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters: trainNo, boarding, destination, classCode, date are required.' });
  }

  // Input Validation
  if (!trainNoRegex.test(trainNo)) {
    return res.status(400).json({ status: 'error', message: 'Invalid train number. Expected exactly 5 digits.' });
  }
  if (!stationRegex.test(boarding) || !stationRegex.test(destination)) {
    return res.status(400).json({ status: 'error', message: 'Invalid station code format. Expected 3-6 uppercase letters.' });
  }
  if (!dateRegex.test(date)) {
    return res.status(400).json({ status: 'error', message: 'Invalid date format. Expected yyyy-mm-dd.' });
  }
  if (!validClasses.includes(classCode.toUpperCase())) {
    return res.status(400).json({ status: 'error', message: 'Invalid class code.' });
  }

  console.log(`Attempting live IRCTC API fetch: Train ${trainNo}, Boarding ${boarding}, Class ${classCode}`);
  
  let bookedSeats = new Set();
  try {
    const dbBookings = await Booking.find({
      trainNo,
      classCode: classCode.toUpperCase(),
      date
    });
    bookedSeats = new Set(dbBookings.map(b => `${b.coach}-${b.berthNo}`));
  } catch (dbErr) {
    console.error('Error fetching bookings from MongoDB:', dbErr);
  }

  try {
    // 1. Fetch Train Composition (coaches + remote details)
    const compositionUrl = 'https://www.irctc.co.in/online-charts/api/trainComposition';
    const requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Origin': 'https://www.irctc.co.in',
      'Referer': 'https://www.irctc.co.in/online-charts/',
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
    };

    const compResponse = await fetch(compositionUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        trainNo: trainNo,
        jDate: date,
        boardingStation: boarding
      })
    });

    if (!compResponse.ok) {
      throw new Error(`IRCTC composition endpoint returned status: ${compResponse.status}`);
    }

    const compJson = await compResponse.json();

    // Check if chart is not prepared
    if (compJson.error || !compJson.cdd) {
      const errorMsg = compJson.error || 'Chart not prepared';
      return res.json({
        status: 'success',
        chartPrepared: false,
        source: 'live',
        message: errorMsg,
        data: {
          trainNumber: trainNo,
          trainName: compJson.trainName || trainNo,
          boarding,
          destination,
          classCode,
          coaches: [],
          vacantBerths: []
        }
      });
    }

    // Extract details for the next request
    const remoteStation = compJson.remote || boarding;
    const trainSourceStation = compJson.from || boarding;
    const trainStartDate = compJson.trainStartDate || date;
    const chartOneFlag = compJson.chartStatusResponseDto?.chartOneFlag || 1;

    // 2. Fetch vacant berths
    const vacancyUrl = 'https://www.irctc.co.in/online-charts/api/vacantBerth';
    const vacResponse = await fetch(vacancyUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        trainNo: trainNo,
        boardingStation: boarding,
        remoteStation: remoteStation,
        trainSourceStation: trainSourceStation,
        jDate: trainStartDate,
        cls: classCode,
        chartType: chartOneFlag
      })
    });

    if (!vacResponse.ok) {
      throw new Error(`IRCTC vacantBerth endpoint returned status: ${vacResponse.status}`);
    }

    const vacJson = await vacResponse.json();

    // Mapped coaches - filtered to only match requested travel class
    const coaches = (compJson.cdd || [])
      .filter(c => c.classCode && c.classCode.trim().toUpperCase() === classCode.trim().toUpperCase())
      .map(c => {
        let cap = 72;
        if (c.classCode === 'SL' || c.classCode === '3A') cap = 72;
        else if (c.classCode === '2A') cap = 48;
        else if (c.classCode === '1A') cap = 24;
        else if (c.classCode === 'CC') cap = 78;
        else if (c.classCode === 'EC') cap = 56;

        return {
          name: c.coachName,
          classCode: c.classCode,
          capacity: cap
        };
      });

    // Mapped vacant berths
    const vacantBerths = (vacJson.vbd || []).map(b => {
      let bType = String(b.berthCode || '').trim().toUpperCase();
      if (bType === 'L') bType = 'LB';
      else if (bType === 'M') bType = 'MB';
      else if (bType === 'U') bType = 'UB';
      else if (bType === 'SL') bType = 'SLB';
      else if (bType === 'SU') bType = 'SUB';
      else if (bType === 'SM') bType = 'SMB';
      else {
        // Fallback to dynamic layout calculation if empty/space
        bType = getBerthType(parseInt(b.berthNumber), classCode) || 'LB';
      }

      return {
        coach: b.coachName,
        berthNo: parseInt(b.berthNumber),
        berthType: bType,
        from: b.from,
        to: b.to,
        class: classCode
      };
    }).filter(b => !bookedSeats.has(`${b.coach}-${b.berthNo}`));

    res.json({
      status: 'success',
      chartPrepared: true,
      source: 'live',
      data: {
        trainNumber: trainNo,
        trainName: compJson.trainName || trainNo,
        boarding,
        destination,
        classCode,
        coaches,
        vacantBerths
      }
    });

  } catch (err) {
    console.warn(`Live IRCTC fetch failed: ${err.message}.`);
    if (process.env.STRICT_REALTIME === 'true') {
      return res.status(502).json({ status: 'error', message: `Live IRCTC fetch failed: ${err.message}` });
    }
    console.warn('Falling back to mock data.');
    const mockVacancy = mockData.getVacancy(trainNo, boarding, destination, classCode, date);
    if (mockVacancy && mockVacancy.vacantBerths) {
      mockVacancy.vacantBerths = mockVacancy.vacantBerths.filter(b => !bookedSeats.has(`${b.coach}-${b.berthNo}`));
    }
    res.json({
      status: 'success',
      chartPrepared: true,
      source: 'simulated',
      warning: `Failed to connect to IRCTC: ${err.message}. Showing simulated data.`,
      data: mockVacancy
    });
  }
});

// Endpoint 5: Train Schedule Lookup (Route Stations)
app.get('/api/train-schedule', async (req, res) => {
  const trainNo = String(req.query.trainNo || '').trim();
  if (!trainNoRegex.test(trainNo)) {
    return res.status(400).json({ status: 'error', message: 'Invalid train number. Expected exactly 5 digits.' });
  }
  
  try {
    const response = await fetch(`https://securedapi.confirmtkt.com/api/platform/trainbooking/schedule?trainNo=${trainNo}`, {
      headers: {
        'Host': 'securedapi.confirmtkt.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const json = await response.json();
      if (json && json.schedule) {
        const stations = json.schedule.map(s => ({
          code: s.stationCodeCode,
          name: s.stationName,
          departureTime: s.departureTime,
          day: s.day
        }));
        return res.json({ status: 'success', source: 'live', trainName: json.trainName, stations });
      }
    }
    throw new Error('Empty schedule returned from API');
  } catch (err) {
    console.warn(`Live schedule fetch failed for train ${trainNo}: ${err.message}. Falling back to mock.`);
    
    const predefined = mockData.PREDEFINED_TRAINS.find(t => t.number === trainNo);
    if (predefined) {
      const stations = predefined.route.map(code => {
        const stn = mockData.STATIONS.find(s => s.code === code);
        return {
          code: code,
          name: stn ? stn.name : code,
          departureTime: '12:00',
          day: 1
        };
      });
      return res.json({ status: 'success', source: 'simulated', trainName: predefined.name, stations });
    }
    
    // Dynamic mock for any unknown train number
    const stations = [
      { code: 'NDLS', name: 'NEW DELHI' },
      { code: 'CNB', name: 'KANPUR CENTRAL' },
      { code: 'PRYJ', name: 'PRAYAGRAJ JN' },
      { code: 'DDU', name: 'PT DEEN DAYAL UPADHYAYA' },
      { code: 'HWH', name: 'HOWRAH JN' }
    ].map(s => ({
      code: s.code,
      name: s.name,
      departureTime: '12:00',
      day: 1
    }));
    return res.json({ status: 'success', source: 'simulated', trainName: `Express Train ${trainNo}`, stations });
  }
});

// Auth Endpoint: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ status: 'error', message: 'Username must be at least 3 characters.' });
    }
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Username is already taken.' });
    }

    const hashedPassword = User.hashPassword(password);
    const newUser = new User({
      username: username.toLowerCase().trim(),
      password: hashedPassword
    });
    await newUser.save();

    const token = newUser._id.toString();
    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: newUser._id,
          username: newUser.username
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Auth Endpoint: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !user.comparePassword(password)) {
      return res.status(400).json({ status: 'error', message: 'Invalid username or password.' });
    }

    const token = user._id.toString();
    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Auth Endpoint: Current User Details
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }
    const token = authHeader.split(' ')[1];
    if (!mongoose.Types.ObjectId.isValid(token)) {
      return res.status(401).json({ status: 'error', message: 'Invalid session token.' });
    }
    const user = await User.findById(token);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found.' });
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Booking Endpoint: Create Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized. Please login to book a seat.' });
    }
    const token = authHeader.split(' ')[1];
    if (!mongoose.Types.ObjectId.isValid(token)) {
      return res.status(401).json({ status: 'error', message: 'Invalid session token.' });
    }
    const user = await User.findById(token);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found. Please re-login.' });
    }

    const {
      trainNo, trainName, coach, berthNo, berthType,
      from, to, passengerName, passengerAge, passengerGender,
      classCode, date
    } = req.body;

    if (!trainNo || !coach || !berthNo || !passengerName || !passengerAge || !passengerGender || !classCode || !date) {
      return res.status(400).json({ status: 'error', message: 'Missing required passenger or seat details.' });
    }

    // Check double-booking
    const existing = await Booking.findOne({ trainNo, coach, berthNo, date });
    if (existing) {
      return res.status(400).json({ status: 'error', message: `Seat ${coach}-${berthNo} has already been booked for this date.` });
    }

    // Generate random 10-digit PNR
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const booking = new Booking({
      userId: user._id,
      pnr,
      trainNo,
      trainName,
      coach,
      berthNo,
      berthType,
      from,
      to,
      passengerName,
      passengerAge,
      passengerGender,
      classCode,
      date
    });

    await booking.save();

    res.json({
      status: 'success',
      data: booking
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Booking Endpoint: Get User Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }
    const token = authHeader.split(' ')[1];
    if (!mongoose.Types.ObjectId.isValid(token)) {
      return res.status(401).json({ status: 'error', message: 'Invalid session token.' });
    }
    const user = await User.findById(token);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found.' });
    }

    const bookings = await Booking.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json({
      status: 'success',
      data: bookings
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
