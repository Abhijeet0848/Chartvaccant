// d:/irctc/scratch/testLiveAPI.js

async function testFetch() {
  const scheduleUrl = 'https://www.irctc.co.in/online-charts/api/trainComposition';
  const scheduleHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Origin': 'https://www.irctc.co.in',
    'Referer': 'https://www.irctc.co.in/online-charts/',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
  };

  const today = '2026-05-26';

  const payload = {
    trainNo: '12302',
    jDate: today,
    boardingStation: 'NDLS'
  };

  try {
    const res = await fetch(scheduleUrl, {
      method: 'POST',
      headers: scheduleHeaders,
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log('Root keys:', Object.keys(json));
    
    // Copy the json but omit 'cdd' to print root properties
    const copy = { ...json };
    delete copy.cdd;
    console.log('Root properties (without cdd):', JSON.stringify(copy, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
