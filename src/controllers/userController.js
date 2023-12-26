// userController.js to Authentacation User Registration

const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config({ path: '../.env' });
const secretKey = process.env.SECRET_KEY; // Accessing the secret key from the environment variable}


// Register a new user
async function registerUser(req, res) {
    try {
      const { username, email, password } = req.body;
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
  
      const newUser = new User({ username, email, password });
      await newUser.save();
  
      const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: '1h' });
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  module.exports = {
    registerUser,
  };
