// services/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/irctc';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[Database] Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.error(`[Database] Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

export default mongoose;
