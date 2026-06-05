// seed.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import './services/db.js'; // initialize db connection
import Station from './models/Station.js';
import Train from './models/Train.js';
import { PREDEFINED_TRAINS } from './services/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  try {
    console.log('[Seed] Starting database seeding...');

    // Wait for connection to open
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }

    // 1. Seed Stations
    console.log('[Seed] Reading stations.json...');
    const stationsPath = path.join(__dirname, 'services', 'stations.json');
    const stationsData = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));

    console.log('[Seed] Clearing existing stations...');
    await Station.deleteMany({});
    
    console.log(`[Seed] Inserting ${stationsData.length} stations. This may take a moment...`);
    // Insert in chunks to avoid memory limit issues
    const chunkSize = 1000;
    for (let i = 0; i < stationsData.length; i += chunkSize) {
      const chunk = stationsData.slice(i, i + chunkSize);
      await Station.insertMany(chunk);
    }
    console.log('[Seed] Stations seeded successfully.');

    // 2. Seed Trains
    console.log('[Seed] Clearing existing trains...');
    await Train.deleteMany({});

    console.log(`[Seed] Inserting ${PREDEFINED_TRAINS.length} predefined trains...`);
    await Train.insertMany(PREDEFINED_TRAINS);
    console.log('[Seed] Trains seeded successfully.');

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed] Seeding failed: ${err.message}`, err);
    process.exit(1);
  }
}

seed();
