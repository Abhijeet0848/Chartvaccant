// scratch/check_irctc_raw.js

async function testRaw() {
  const trainNo = '12926';
  const boarding = 'NDLS';
  const classCode = '3A';
  
  // Use today's date formatted appropriately (or yesterday since it's departed and charts are prepared)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;
  
  console.log(`Fetching train composition for Train: ${trainNo}, Boarding: ${boarding}, Date: ${date}...`);
  const compositionUrl = 'https://www.irctc.co.in/online-charts/api/trainComposition';
  const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Origin': 'https://www.irctc.co.in',
    'Referer': 'https://www.irctc.co.in/online-charts/',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8'
  };

  try {
    const compResponse = await fetch(compositionUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        trainNo: trainNo,
        jDate: date,
        boardingStation: boarding
      })
    });

    console.log(`Composition Response Status: ${compResponse.status}`);
    const compJson = await compResponse.json();
    console.log('Composition response keys:', Object.keys(compJson));
    
    if (compJson.cdd && compJson.cdd.length > 0) {
      console.log('Sample coach details (cdd[0]):', compJson.cdd[0]);
    } else {
      console.log('No coaches details in response:', compJson);
      return;
    }

    const remoteStation = compJson.remote || boarding;
    const trainSourceStation = compJson.from || boarding;
    const trainStartDate = compJson.trainStartDate || date;
    const chartOneFlag = compJson.chartStatusResponseDto?.chartOneFlag || 1;

    console.log(`Fetching vacant berths: remote=${remoteStation}, source=${trainSourceStation}, startDate=${trainStartDate}, class=${classCode}`);
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

    console.log(`Vacancy Response Status: ${vacResponse.status}`);
    const vacJson = await vacResponse.json();
    console.log('Vacancy response keys:', Object.keys(vacJson));
    if (vacJson.vbd && vacJson.vbd.length > 0) {
      console.log('Sample vacant berth (vbd[0]):', vacJson.vbd[0]);
      console.log(`Total vacant berths returned: ${vacJson.vbd.length}`);
      
      const targetBerths = vacJson.vbd.filter(b => b.berthNumber === 43 && b.coachName === 'B2');
      console.log('Raw vacant berths for B2-43:', targetBerths);
    } else {
      console.log('No vacant berths in response:', vacJson);
    }
  } catch (err) {
    console.error('Error during raw test:', err);
  }
}

testRaw();
