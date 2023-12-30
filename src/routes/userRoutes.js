// userRoutes.js file to define routes related to user authentication.

const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userAuthController');
const { authenticateToken } = require('../middlewares/userAuthMiddleware');
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

// Example protected route to fetch user profile based on user ID
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Extract and send necessary user profile information
    const userProfile = {
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      // Add other necessary fields
    };
    
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
