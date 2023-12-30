// userAuthController.js to Authentacation User Login

const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config({ path: '../.env' });
const secretKey = process.env.SECRET_KEY; // Accessing the secret key from the environment variable}

async function loginUser(req, res) {
    try {
      const { identifier, password } = req.body;
      const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const isPasswordValid = await user.comparePassword(password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
  
      const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  module.exports = {
    loginUser,
  };