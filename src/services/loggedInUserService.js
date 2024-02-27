const jwt = require('jsonwebtoken')
const User = require('../models/User')

require('dotenv').config({ path: '../.env' })
const secretKey = process.env.SECRET_KEY // Accessing the secret key from the environment variable}

// Get logged-in user data
async function getLoggedInUserData(req, res) {
  try {
    // Retrieve user data from the request object (added by middleware)
    const userId = req.user.userId // Extract userId from the logged-in user data

    // Fetch user data from the database using the userId
    const loggedInUser = await User.findById(userId)

    if (!loggedInUser) {
      console.log('Logged-in user not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Logged-in user not found' })
    }
    console.log('Logged-in user:', loggedInUser)
    console.log('---------------------------------------------')

    // Send the user data in the response
    res.status(200).json(loggedInUser)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

// Get logged-in user data no response (for reuse code to retrieve logged-in user data)
async function getLoggedInUserDataNoRes(req, res) {
  try {
    // Retrieve user data from the request object (added by middleware)
    const userId = req.user.userId // Extract userId from the logged-in user data

    // Fetch user data from the database using the userId
    const loggedInUser = await User.findById(userId)

    if (!loggedInUser) {
      console.log('Logged-in user not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Logged-in user not found' })
    }
    //   console.log('Logged-in user:', loggedInUser)
    console.log('Logged-in user:', {
      ID: loggedInUser._id.toString(),
      //   name: loggedInUser.name,
      username: loggedInUser.username,
      role: loggedInUser.role,
    })
    console.log('---------------------------------------------')

    return loggedInUser // Only return the data without sending the response
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getLoggedInUserData,
  getLoggedInUserDataNoRes,
}
