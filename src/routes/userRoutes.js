// userRoutes.js file to define routes related to user authentication.

const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userAuthController');
// const { authenticateToken } = require('../middlewares/userAuthMiddleware');
const User = require('../models/User');

// GET all users (not authen)
// router.get('/', async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// User registration
router.post('/register', registerUser);

// User login
router.post('/login', loginUser);


// Get all users
router.get('/', /* authenticateToken ,*/ async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user by ID
router.get('/:userId', /* authenticateToken ,*/ async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user by ID - Placeholder
router.delete('/:userId', /* authenticateToken ,*/ async (req, res) => {
  try {
    // Implement user deletion logic here using req.params.userId
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit user by ID - Placeholder for future use (using PUT)
router.put('/:userId', /* authenticateToken ,*/ async (req, res) => {
  try {
    // Implement user editing logic here using req.params.userId and req.body
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
