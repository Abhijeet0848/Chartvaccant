// d:/irctc/scratch/testLiveVacancy.js

async function testFetch() {
  const vacancyUrl = 'https://www.irctc.co.in/online-charts/api/vacantBerth';
  const vacancyHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Origin': 'https://www.irctc.co.in',
    'Referer': 'https://www.irctc.co.in/online-charts/',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
  };

  const payload = {
    trainNo: '12302',
    boardingStation: 'NDLS',
    remoteStation: 'NDLS',
    trainSourceStation: 'NDLS',
    jDate: '2026-05-26',
    cls: '3A',
    chartType: 1
  };

  console.log('Sending request to IRCTC (www.irctc.co.in/online-charts/api/vacantBerth)...', payload);

  try {
    const res = await fetch(vacancyUrl, {
      method: 'POST',
      headers: vacancyHeaders,
      body: JSON.stringify(payload)
    });

    console.log('Response Status:', res.status);
    const json = await res.json();
    console.log('Response JSON keys:', Object.keys(json));
    
    // Print the first few vacant berths if any exist
    if (json.vbd) {
      console.log(`Found ${json.vbd.length} vacant berths!`);
      console.log('First 5 vacant berths:', JSON.stringify(json.vbd.slice(0, 5), null, 2));
    } else {
      console.log('No vbd array found in response. Response:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
