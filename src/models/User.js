// User.js file defines the Mongoose model for the User schema.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userPicture: String,
    name: String,
    idCard: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    phoneNumber: String,
    DOB: Date,
    userAddress: String,
    createdOn: {
      type: Date,
      default: Date.now
    },
    updatedOn: {
      type: Date,
      default: Date.now
    }
  });

  const User = mongoose.model('User', userSchema);

  module.exports = User;
