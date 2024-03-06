// userController.js to Authentacation User Registration
require('dotenv').config({ path: '../.env' })
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
const secretKey = process.env.SECRET_KEY // Accessing the secret key from the environment variable}

// Import models
const User = require('../models/User')

// Import service
const azureBlobService = require('../services/azureBlobService') // Adjust the path as needed
const loggedInUserService = require('../services/loggedInUserService')

//----------------- Register a new user ----------------------------------------------------
async function registerUser(req, res) {
  console.log('Request file:', req.file)
  console.log('---------------------------------------------')
  try {
    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 3 * 1024 * 1024) {
      console.log('Image size should be less than 3 MB.')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Image size should be less than 3 MB.' })
    }

    // Validation function
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
      homePicture,
    } = req.body

    // Upload pic to Blob
    const containerName = 'users'
    let imageUrl

    if (userPicture && isExternalUrl(userPicture)) {
      // If the picture is an external URL, use it directly
      imageUrl = req.body.userPicture
    } else if (req.file) {
      // Set the imageUrl as the Blob URL
      imageUrl = await azureBlobService.uploadImageToBlob(req, containerName)
    }

    // Check for required fields
    if (!name || !username || !email || !password || !phoneNumber || !DOB) {
      console.log('Missing required fields')
      console.log('---------------------------------------------')
      return res.status(400).json({
        message:
          'Missing required fields: name, username, email, password, DOB, and phone number',
      })
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      console.log('Username or email already exists')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Username or email already exists' })
    }

    const {
      postCode,
      tambonThaiShort,
      districtThaiShort,
      provinceThai,
      addressLine1,
      addressLine2,
    } = userAddress

    // Create a new user object with required fields
    const newUserFields = new User({
      name,
      username,
      email,
      password,
      phoneNumber,
      userPicture,
      idCard: idCard,
      DOB: DOB,
      role: role,
      userAddress: {
        postCode,
        tambonThaiShort,
        districtThaiShort,
        provinceThai,
        addressLine1,
        addressLine2,
      },
      homePicture: homePicture,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    // Conditionally include userPicture if imageUrl is defined
    if (imageUrl) {
      newUserFields.userPicture = imageUrl
    }

    // If userAddress is provided, validate and add it to the new user document
    if (userAddress) {
      // Ensure that the required address fields are present
      if (
        !postCode ||
        !tambonThaiShort ||
        !districtThaiShort ||
        !provinceThai
      ) {
        return res
          .status(400)
          .json({ message: 'Incomplete address information' })
      }

      // Add the validated address fields to the newUserFields object
      newUserFields.userAddress = {
        postCode,
        tambonThaiShort,
        districtThaiShort,
        provinceThai,
        addressLine1,
        addressLine2,
      }
    }

    // Create a new user document
    const newUser = new User(newUserFields)
    // Save the new user document to the database
    await newUser.save()

    res
      .status(201)
      .json({ message: 'User created successfully!', user: newUser })
    console.log('User created successfully!', newUser)
    console.log('---------------------------------------------')
  } catch (error) {
    console.log(error)
    console.log('---------------------------------------------')
    res.status(500).json({ message: error.message })
  }
}

// Helper function to check if a URL is external
function isExternalUrl(url) {
  return /^(https?:\/\/|www\.)\S+$/.test(url)
}

// ----------------- Login user -----------------------------------------------------
async function loginUser(req, res) {
  try {
    const { identifier, password } = req.body

    // Check for required fields
    if (!identifier || !password) {
      console.log('Username or Email, and password are required')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Username or Email, and password are required' })
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    })

    if (!user) {
      console.log('User not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'User not found' })
    }

    // Compare the provided password with the stored encrypted password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('Invalid password')
      console.log('---------------------------------------------')
      return res.status(401).json({ message: 'Invalid password' })
    }

    // Create token payload
    const tokenPayload = {
      userId: user._id,
      username: user.username, // Add any other necessary user data here
      // Add more user data as needed
    }

    const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' })
    res.status(200).json({ token, user: tokenPayload })
    console.log('User:', identifier, 'logged-in successfully!')
    console.log('---------------------------------------------')
  } catch (error) {
    console.log(error)
    console.log('---------------------------------------------')
    res.status(500).json({ message: error.message })
  }
}

// ----------------- Get all users ------------------------------------------------------------
async function getAllUsers(req, res) {
  try {
    const users = await User.find()
    res.json(users)
    console.log('All users:', users)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log(err)
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    // Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Fetch user data from the database using the provided userId
    const user = await User.findById(req.params.userId)

    if (!user) {
      console.log('User not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'User not found' })
    }

    // Send the user data in the response
    res.json({ user })
    console.log('Requested user:', user)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log(err)
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// ----------------- Delete user by ID (Admin only) -----------------------------------------
async function deleteUserById(req, res) {
  try {
    // Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInuserId = loggedInUser._id.toString()

    // Retrieve the user account by userId
    const existingUserData = await User.findById(req.params.userId)
    const existingUserId = existingUserData._id.toString()

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingUserId !== loggedInuserId) {
      console.log('You are not authorized to delete this user')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this user' })
    }

    // Find the user account by userId
    const user = await User.findById(existingUserId)

    if (!user) {
      console.log('User not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'User not found' })
    }

    // Find the user by userId and delete
    const deletedUser = await User.findByIdAndDelete(existingUserId)

    res.json({ message: 'User deleted:', deletedUser })
    console.log(
      'User ID:',
      deletedUser._id.toString(),
      'username:',
      deletedUser.username
    )
    console.log('is deleted by', {
      ID: loggedInuserId,
      username: loggedInUser.username,
      role: loggedInUserRole,
    })
    console.log('---------------------------------------------')
  } catch (err) {
    console.log(err)
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// ----------------- Edit user by ID (Admin only) ----------------------------------------------------
async function editUserById(req, res) {
  try {
    // Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInuserId = loggedInUser._id.toString()

    const existingUserData = await User.findById(req.params.userId)
    console.log('user post:', existingUserData)
    console.log('---------------------------------------------')

    const existingUserId = existingUserData._id.toString()

    // Validation function
    const errors = validationResult(req).formatWith(({ value, msg }) => ({
      value,
      msg,
    }))
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingUserId !== loggedInuserId) {
      console.log('You are not authorized to edit this user')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this user' })
    }

    // Find the user by userId
    const user = await User.findById(existingUserId)

    if (!user) {
      console.log('User not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'User not found' })
    }

    const updatedFields = {}
    const currentDate = new Date()

    if (req.body.username) {
      updatedFields.username = req.body.username
    }

    if (req.body.phoneNumber) {
      updatedFields.phoneNumber = req.body.phoneNumber
    }
    if (req.body.idCard) {
      updatedFields.idCard = req.body.idCard
    }

    if (req.body.userAddress) {
      updatedFields.userAddress = req.body.userAddress
    }

    // If there are fields to update, add/update the 'updatedOn' field
    if (Object.keys(updatedFields).length > 0) {
      updatedFields.updatedOn = currentDate
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updatedFields },
      { new: true }
    )

    res.json({ message: 'Updated field:', updatedFields })
    console.log('Updated field:', updatedFields)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' })
  }
}

// ----------------- Edit Logged in user -------------------------------------------------------
async function editLoggedInUser(req, res) {
  try {
    // Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInuserId = loggedInUser._id.toString()

    const existingUserData = await User.findById(loggedInUser)
    const existingUserId = existingUserData._id.toString()
    console.log('user post:', existingUserData)
    console.log('---------------------------------------------')

    // Validation function
    const errors = validationResult(req).formatWith(({ value, msg }) => ({
      value,
      msg,
    }))
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingUserId !== loggedInuserId) {
      console.log('You are not authorized to edit this user')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this user' })
    }

    const updatedFields = {}
    const currentDate = new Date()

    if (req.body.username) {
      updatedFields.username = req.body.username
    }

    if (req.body.phoneNumber) {
      updatedFields.phoneNumber = req.body.phoneNumber
    }
    if (req.body.idCard) {
      updatedFields.idCard = req.body.idCard
    }

    if (req.body.userAddress) {
      updatedFields.userAddress = req.body.userAddress
    }


    // If there are fields to update, add/update the 'updatedOn' field
    if (Object.keys(updatedFields).length > 0) {
      updatedFields.updatedOn = currentDate
    }

    const updatedUser = await User.findByIdAndUpdate(
      existingUserData._id,
      { $set: updatedFields },
      { new: true }
    )

    res.json({ message: 'Updated field:', updatedFields })
    console.log('Updated field:', updatedFields)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' })
  }
}

// ----------------- Delete Logged in user -------------------------------------------
async function deleteLoggedInUser(req, res) {
  try {
    // Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInUserId = loggedInUser._id.toString()

    // Check if the user is logged in and request is matches or not
    const existingUserData = await User.findById(loggedInUser)
    const existingUserId = existingUserData._id.toString()

    console.log('User account:', {
      ID: existingUserId,
      username: existingUserData.username,
    })
    console.log('---------------------------------------------')

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingUserId !== loggedInUserId) {
      console.log('You are not authorized to delete this user')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this user' })
    }

    // Find the user by userId and delete
    const deletedUser = await User.findByIdAndDelete(existingUserId)

    res.json({ message: 'User deleted:', deletedUser })
    console.log(
      'User:',
      {
        ID: deletedUser._id.toString(),
        username: deletedUser.username,
      },
      'is deleted'
    )
    console.log('---------------------------------------------')
  } catch (err) {
    console.log(err)
    console.log('---------------------------------------------')
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
  // getLoggedInUserData,
  editLoggedInUser,
  deleteLoggedInUser,
}
