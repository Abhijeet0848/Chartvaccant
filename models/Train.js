// models/Train.js
import mongoose from 'mongoose';

const trainSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  depTime: {
    type: String,
    required: true
  },
  arrTime: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  classes: [{
    type: String
  }],
  route: [{
    type: String
  }],
  runsOn: [{
    type: String
  }]
});

const Train = mongoose.model('Train', trainSchema);
export default Train;
export { Train };
