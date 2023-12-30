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

  // Get all users
async function getAllUsers(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Delete user by ID - Placeholder
async function deleteUserById(req, res) {
  try {
    // Implement user deletion logic here using req.params.userId
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Edit user by ID - Placeholder for future use (using PUT)
async function editUserById(req, res) {
  try {
    // Implement user editing logic here using req.params.userId and req.body
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  registerUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  editUserById,
};
