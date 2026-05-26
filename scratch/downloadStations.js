// d:/irctc/scratch/downloadStations.js
import fs from 'fs';

async function tryDownload(url) {
  console.log(`Trying to fetch: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed with status: ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`SUCCESS! Loaded ${Array.isArray(data) ? data.length : Object.keys(data).length} entries.`);
    return data;
  } catch (err) {
    console.log(`Error: ${err.message}`);
    return null;
  }
}

async function run() {
  const urls = [
    'https://raw.githubusercontent.com/namastevis/india-railway-stations/master/stations.json',
    'https://raw.githubusercontent.com/IamYVJ/Indian_Railway_Stations_JSON/main/stations.json',
    'https://raw.githubusercontent.com/apurbadebnath/indianrlystations/master/stations.json',
    'https://raw.githubusercontent.com/datameet/railways/master/stations.json'
  ];
  
  let data = null;
  for (const url of urls) {
    data = await tryDownload(url);
    if (data) {
      console.log('Writing file to d:/irctc/services/stations.json...');
      
      let formatted = [];
      if (Array.isArray(data)) {
        if (data.length > 0 && data[0].Station_Code) {
          formatted = data.map(item => ({
            code: item.Station_Code,
            name: item.Station_Name,
            city: item.Station_Name
          }));
        } else if (data.length > 0 && data[0].stnCode) {
          formatted = data.map(item => ({
            code: item.stnCode,
            name: item.stnName,
            city: item.stnCity || item.stnName
          }));
        } else if (data.length > 0 && data[0].code) {
          formatted = data.map(item => ({
            code: item.code,
            name: item.name,
            city: item.city || item.name
          }));
        } else if (data.length > 0 && data[0].stationCode) {
          formatted = data.map(item => ({
            code: item.stationCode,
            name: item.stationName,
            city: item.city || item.stationName
          }));
        } else {
          formatted = data;
        }
      } else {
        if (data.features) {
          formatted = data.features.map(f => {
            const props = f.properties || {};
            return {
              code: props.code || props.stationCode || '',
              name: props.name || props.stationName || '',
              city: props.city || props.name || ''
            };
          }).filter(s => s.code);
        } else {
          formatted = Object.entries(data).map(([code, name]) => ({
            code: code,
            name: typeof name === 'string' ? name : (name.name || name.stationName || code),
            city: typeof name === 'object' ? (name.city || name.name) : name
          }));
        }
      }
      
      formatted = formatted.filter(s => s.code && s.name);
      
      const seen = new Set();
      const unique = [];
      for (const st of formatted) {
        const cleanCode = st.code.trim().toUpperCase();
        if (!seen.has(cleanCode)) {
          seen.add(cleanCode);
          unique.push({
            code: cleanCode,
            name: st.name.trim(),
            city: (st.city || st.name).trim()
          });
        }
      }
      
      // Sort unique stations alphabetically by name
      unique.sort((a, b) => a.name.localeCompare(b.name));
      
      fs.writeFileSync('d:/irctc/services/stations.json', JSON.stringify(unique, null, 2));
      console.log(`Successfully saved ${unique.length} formatted stations!`);
      break;
    }
  }
}

run();
