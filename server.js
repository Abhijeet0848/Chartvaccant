// server.js
import express from 'express';
import cors from 'cors';
import * as mockData from './services/mockData.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint 1: Station Autocomplete
app.get('/api/stations', (req, res) => {
  const query = req.query.q || '';
  const results = mockData.getStations(query);
  res.json({ status: 'success', data: results });
});

// Endpoint 2: Train Search
app.post('/api/trains', (req, res) => {
  const { from, to, date } = req.body;
  if (!from || !to || !date) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters: from, to, date are required.' });
  }

  // Get trains from route
  const trains = mockData.getTrainsBetween(from, to, date);
  res.json({ status: 'success', data: trains });
});

// Endpoint 3: PNR Decoder Lookup
app.post('/api/pnr', (req, res) => {
  const { pnr } = req.body;
  if (!pnr || pnr.length !== 10) {
    return res.status(400).json({ status: 'error', message: 'Invalid PNR. Please enter a 10-digit number.' });
  }

  // Generate deterministic details based on PNR digits
  // Sum up PNR digits to get a seed
  let digitSum = 0;
  for (let i = 0; i < pnr.length; i++) {
    digitSum += parseInt(pnr[i]) || 0;
  }

  // Get today's date formatted
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  let pnrProfile = {};

  // Alternate profiles based on last digit
  const lastDigit = parseInt(pnr[9]) || 0;
  if (lastDigit % 3 === 0) {
    // NDLS to HWH
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
    // NDLS to MMCT
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
    // SBC to MAS
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

  res.json({ status: 'success', data: pnrProfile });
});

// Endpoint 4: Train Chart Vacancy details (Realtime Endpoint)
app.post('/api/vacancy', async (req, res) => {
  const { trainNo, boarding, destination, classCode, date } = req.body;

  if (!trainNo || !boarding || !destination || !classCode || !date) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters: trainNo, boarding, destination, classCode, date are required.' });
  }

  console.log(`Attempting live IRCTC API fetch: Train ${trainNo}, Boarding ${boarding}, Class ${classCode}`);
  
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
      let bType = b.berthCode;
      if (bType === 'L') bType = 'LB';
      else if (bType === 'M') bType = 'MB';
      else if (bType === 'U') bType = 'UB';
      else if (bType === 'SL') bType = 'SLB';
      else if (bType === 'SU') bType = 'SUB';
      else if (bType === 'SM') bType = 'SMB';

      return {
        coach: b.coachName,
        berthNo: parseInt(b.berthNumber),
        berthType: bType,
        from: b.from,
        to: b.to,
        class: classCode
      };
    });

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
    console.error(`Live IRCTC fetch failed: ${err.message}`);
    res.status(502).json({
      status: 'error',
      message: `Failed to fetch live IRCTC data: ${err.message}. Connection blocked or rate limited.`
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
