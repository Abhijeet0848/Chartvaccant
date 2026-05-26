// d:/irctc/scratch/checkFormat.js

async function run() {
  const url = 'https://raw.githubusercontent.com/namastevis/india-railway-stations/master/stations.json';
  const res = await fetch(url);
  const json = await res.json();
  
  console.log('Is array:', Array.isArray(json));
  console.log('Sample data (keys or first entries):');
  if (Array.isArray(json)) {
    console.log(json.slice(0, 3));
  } else {
    console.log(Object.keys(json).slice(0, 5));
    const firstKey = Object.keys(json)[0];
    console.log('First entry:', firstKey, json[firstKey]);
  }
}

run();
