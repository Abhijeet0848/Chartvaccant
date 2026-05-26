// d:/irctc/scratch/findStationsAPI.js

async function run() {
  const url = 'https://www.irctc.co.in/online-charts/static/js/main.d3ec0804.chunk.js';
  const res = await fetch(url);
  const code = await res.text();
  
  let pos = 0;
  while (true) {
    const idx = code.indexOf('stationList', pos);
    if (idx === -1) break;
    console.log(`\nOccurrence of stationList at index ${idx}:`);
    console.log(code.substring(Math.max(0, idx - 150), Math.min(code.length, idx + 250)));
    pos = idx + 1;
  }

  // Also search for JSON files loaded, like .json
  const jsonRegex = /[a-zA-Z0-9_\-/]+\.json/gi;
  const jsonMatches = code.match(jsonRegex);
  if (jsonMatches) {
    console.log('\nJSON files referenced in JS bundle:', Array.from(new Set(jsonMatches)));
  }
}

run();
