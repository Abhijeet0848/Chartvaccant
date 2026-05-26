// d:/irctc/scratch/findEndpoints.js

async function run() {
  const url = 'https://www.irctc.co.in/online-charts/static/js/main.d3ec0804.chunk.js';
  const res = await fetch(url);
  const code = await res.text();
  
  const indices = [31849, 36258];
  
  for (const idx of indices) {
    console.log(`\n--- Code Snippet around index ${idx} ---`);
    const start = Math.max(0, idx - 200);
    const end = Math.min(code.length, idx + 800);
    console.log(code.substring(start, end));
  }
}

run();
