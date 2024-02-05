// userRoutes.js file to define routes related to user authentication.

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getAllUsers, getUserById, deleteUserById, editUserById } = require('../controllers/userController');

const userController = require('../controllers/userController');
router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);

// const { authenticateToken } = require('../middlewares/userAuthMiddleware');
const User = require('../models/User');

// User registration
router.post('/register', registerUser);

// User login
router.post('/login', loginUser);

// Get all users - Temporarily removed authentication middleware
router.get('/', /* authenticateToken, */ getAllUsers);

// Get user by ID - Temporarily removed authentication middleware
router.get('/:userId', /* authenticateToken, */ getUserById);

// Delete user by ID - Placeholder - Temporarily removed authentication middleware
router.delete('/:userId', /* authenticateToken, */ deleteUserById);

// Edit user by ID (using PUT) - Placeholder - Temporarily removed authentication middleware
router.put('/:userId', /* authenticateToken, */ editUserById);

module.exports = router;
