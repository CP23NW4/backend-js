// userController.js to Authentacation User Registration

const jwt = require('jsonwebtoken')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

require('dotenv').config({ path: '../.env' })
const secretKey = process.env.SECRET_KEY // Accessing the secret key from the environment variable}

const { validationResult } = require('express-validator')

// Register a new user
async function registerUser(req, res) {
  try {
    const errors = validationResult(req).formatWith(({ value, msg }) => ({
      value,
      msg,
    }))
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const {
      userPicture,
      name,
      idCard,
      username,
      email,
      password,
      phoneNumber,
      DOB,
      role,
      userAddress,
    } = req.body

    // Check for required fields
    if (!name || !username || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Username or email already exists' })
    }

    // Create a new user object with required fields
    const newUser = new User({
      name,
      username,
      email,
      password,
      phoneNumber,
      userPicture: userPicture || null,
      idCard: idCard || null,
      DOB: DOB || null,
      role: 'general', // Default role
      userAddress: userAddress || null,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    await newUser.save()

    res
      .status(201)
      .json({ message: 'User created successfully', user: newUser })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Login user
async function loginUser(req, res) {
  try {
    const { identifier, password } = req.body

    // Check for required fields
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: 'Username/Email and password are required' })
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Compare the provided password with the stored encrypted password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' })
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' })
    res.status(200).json({ token })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await User.find()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Delete user by ID
async function deleteUserById(req, res) {
  try {
    const userId = req.params.userId

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Find the user by userId and delete
    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'User deleted', deletedUser })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Edit user by ID - Placeholder for future use (using PUT)
async function editUserById(req, res) {
  try {
    const userId = req.params.userId
    // const { username, phoneNumber, userAddress, password } = req.body;
    const { username, phoneNumber, userAddress } = req.body

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Find the user by userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // If username is provided, ensure it's unique
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username })

      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' })
      }

      user.username = username
    }

    // Update phoneNumber if provided
    if (phoneNumber) {
      user.phoneNumber = phoneNumber
    }

    // Update userAddress if provided
    if (userAddress) {
      user.userAddress = userAddress
    }

    // // Update password if provided (encrypt using bcrypt)
    // if (password) {
    //   const hashedPassword = await bcrypt.hash(password, 10);
    //   user.password = hashedPassword;
    // }

    await user.save()

    res.json({ message: 'User updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUserById,
  editUserById,
}
