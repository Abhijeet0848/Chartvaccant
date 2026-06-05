// scratch/test_api.js

async function testLocalTrains() {
  console.log('Querying local /api/trains endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/trains', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NDLS',
        to: 'HWH',
        date: '2026-06-10'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const json = await response.json();
    console.log('Status of response JSON:', json.status);
    if (json.status === 'success') {
      console.log(`Successfully fetched ${json.data.length} trains!`);
      console.log('Sample train:', json.data[0]);
    } else {
      console.log('Error returned:', json);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function testLocalPnr() {
  console.log('Querying local /api/pnr endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/pnr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pnr: '4341029410' // Test PNR
      })
    });
    
    console.log(`Status: ${response.status}`);
    const json = await response.json();
    console.log('Status of response JSON:', json.status);
    if (json.status === 'success') {
      console.log('Successfully fetched PNR profile! Data:', json.data);
      if (json.warning) {
        console.log('Warning (Graceful fallback):', json.warning);
      }
    } else {
      console.log('Error returned:', json);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function testLocalVacancy() {
  console.log('Querying local /api/vacancy endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/vacancy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trainNo: '12926',
        boarding: 'NDLS',
        destination: 'MMCT',
        classCode: '3A',
        date: '2026-06-04'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const json = await response.json();
    console.log('Status of response JSON:', json.status);
    if (json.status === 'success') {
      console.log('Successfully fetched Vacancy! data length of vacantBerths:', json.data.vacantBerths.length);
      console.log('Source:', json.source);
      if (json.warning) {
        console.log('Warning (fallback):', json.warning);
      }
    } else {
      console.log('Error returned:', json);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function run() {
  await testLocalTrains();
  console.log('\n--------------------\n');
  await testLocalPnr();
  console.log('\n--------------------\n');
  await testLocalVacancy();
}

run();
