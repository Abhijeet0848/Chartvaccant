// models/Station.js
import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String
  }
});

// Add text search indexes on code, name, and city for efficient lookup
stationSchema.index({ code: 'text', name: 'text', city: 'text' });

const Station = mongoose.model('Station', stationSchema);
export default Station;
export { Station };
