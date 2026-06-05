// models/User.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static helper method for password hashing
userSchema.statics.hashPassword = function(password) {
  const salt = 'irctc_secure_salt_value'; // salt for key derivation
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

// Instance method to check password
userSchema.methods.comparePassword = function(candidatePassword) {
  const hashedCandidate = this.constructor.hashPassword(candidatePassword);
  return this.password === hashedCandidate;
};

const User = mongoose.model('User', userSchema);
export default User;
export { User };
