// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pnr: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  trainNo: {
    type: String,
    required: true
  },
  trainName: {
    type: String,
    required: true
  },
  coach: {
    type: String,
    required: true
  },
  berthNo: {
    type: Number,
    required: true
  },
  berthType: {
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
  passengerName: {
    type: String,
    required: true
  },
  passengerAge: {
    type: Number,
    required: true
  },
  passengerGender: {
    type: String,
    required: true
  },
  classCode: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
export { Booking };
