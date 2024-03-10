// strayAnimalController.js for handling operations related to stray animals.

const { validationResult } = require('express-validator')
const StrayAnimal = require('../models/StrayAnimal')
const User = require('../models/User')
const azureBlobService = require('../services/azureBlobService')
const axios = require('axios')
require('dotenv').config({ path: '../.env' })
const jwt = require('jsonwebtoken')
const fs = require('fs')
const AdoptionRequest = require('../models/AdoptionRequest')

const { uploadImageToBlob } = require('../services/azureBlobService') // Adjust the path as needed

// Get all stray animals
const getAllStrayAnimals = async (req, res) => {
  try {
    const allStrayAnimals = await StrayAnimal.find().sort({ createdOn: -1 })
    res.json(allStrayAnimals)
    console.log('All animals:', allStrayAnimals)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log('Can not get animals')
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// Get animal by ID
const getStrayAnimalById = async (req, res) => {
  try {
    const strayAnimalbyId = await StrayAnimal.findById(req.params.saId)
    if (!strayAnimalbyId) {
      console.log('Animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }
    res.json(strayAnimalbyId)
    console.log('Animal:', strayAnimalbyId)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log('Can not get this animal')
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// Create a new stray animal
const createStrayAnimal = async (req, res) => {
  console.log('Request Body:', req.body)
  console.log('Request File:', req.file)
  console.log('---------------------------------------------')

  try {
    // Get logged-in user data
    // Retrieve user data from the request object (added by middleware)
    const userId = req.user.userId // Extract userId from the logged-in user data

    // Fetch user data from the database using the userId
    const loggedInUser = await User.findById(userId)
    console.log('Logged-in user:', {
      ID: loggedInUser._id.toString(),
      name: loggedInUser.name,
      username: loggedInUser.username,
      role: loggedInUser.role,
    })
    console.log('---------------------------------------------')

    if (!loggedInUser) {
      console.log('Logged-in user not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Logged-in user not found' })
    }

    // Check if the user is logged in
    if (!loggedInUser) {
      console.log('Unauthorized')
      console.log('---------------------------------------------')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // // Check user role for permissions
    // if (loggedInUser.role !== 'general') {  // only users with the "general" role can create
    //   console.log('Insufficient permissions')
    //   console.log('---------------------------------------------')
    //   return res.status(403).json({ message: 'Insufficient permissions' })
    // }

    if (!req.file) {
      console.log('Picture is required.')
      console.log('---------------------------------------------')
      return res.status(400).json({ message: 'Picture is required.' })
    }

    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 11 * 1024 * 1024) {
      console.log('Image size should be less than 10MB.')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Image size should be less than 11MB.' })
    }

    const { name, type, gender, color, description } = req.body

    // Handle image upload to Azure Blob Storage
    // Determine the container based on the animal type
    let containerName
    if (type.toLowerCase() === 'dog') {
      containerName = 'dogs'
    } else if (type.toLowerCase() === 'cat') {
      containerName = 'cats'
    } else {
      console.log('Types of animal should be Dog or Cat.')
      console.log('---------------------------------------------')
      return res.status(400).json({
        message: 'Invalid animal type. Supported types are Dog and Cat.',
      })
    }

    let imageUrl

    if (isExternalUrl(req.body.picture)) {
      // If the picture is an external URL, use it directly
      imageUrl = req.body.picture
    } else {
      // If the picture is part of form-data, upload it to Azure Blob Storage
      const fileBuffer = req.file.buffer // Access the file buffer from form-data
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg` // Change the filename as per your requirements

      // Upload image to Azure Blob Storage
      await azureBlobService.uploadImageToBlob(
        fileBuffer,
        fileName,
        containerName
      )

      // Set the imageUrl as the Blob URL
      imageUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${containerName}/${fileName}`
    }

    // Create a new stray animal with the Azure Blob Storage URL
    const newStrayAnimal = new StrayAnimal({
      name,
      picture: imageUrl,
      type,
      gender,
      color,
      description,
      owner: {
        ownerId: loggedInUser._id,
        ownerUsername: loggedInUser.username,
        phoneNumber: loggedInUser.phoneNumber,
        role: loggedInUser.role,
      },
      createdOn: new Date(),
    })

    // Save the stray animal to the database
    const savedStrayAnimal = await newStrayAnimal.save()

    res.status(201).json(savedStrayAnimal)
    console.log('Animal post has been created!', savedStrayAnimal)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error(error)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to create a new stray animal' })
  }
}

// Helper function to check if a URL is external
function isExternalUrl(url) {
  return /^(https?:\/\/|www\.)\S+$/.test(url)
}

// Helper function to read a file asynchronously
function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

// Update a stray animal by ID
const updateStrayAnimal = async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const specificErrors = {}

    errors.array().forEach((error) => {
      if (!specificErrors[error.param]) {
        specificErrors[error.param] = error.msg
      }
    })

    console.log(specificErrors)
    console.log('---------------------------------------------')
    return res.status(400).json(specificErrors)
  }

  try {
    // Retrieve logged-in user's data
    const userId = req.user.userId
    console.log('User ID:', userId)
    // console.log('---------------------------------------------')
    const loggedInUser = await User.findById(userId)

    // Check if the user is logged in
    if (!loggedInUser) {
      console.log('Unauthorized')
      console.log('---------------------------------------------')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const loggedInUserId = loggedInUser._id
    // const loggedInUserUsername = loggedInUser.username
    const loggedInUserRole = loggedInUser.role
    console.log('Logged-in ID:', loggedInUserId)
    console.log('Logged-in role:', loggedInUserRole)
    console.log('---------------------------------------------')

    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const existingStrayAnimalOwnerId = existingStrayAnimal.owner.ownerId
    console.log('Animal owner:', existingStrayAnimalOwnerId)
    // console.log('Animal data:', existingStrayAnimal)
    console.log('---------------------------------------------')

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingStrayAnimalOwnerId !== userId) {
      console.log('You are not authorized to edit this animal')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this animal' })
    }

    const updatedFields = {}
    const currentDate = new Date()

    if (req.body.name) {
      updatedFields.name = req.body.name
    }
    if (req.body.picture) {
      updatedFields.picture = req.body.picture
    }
    // if (req.body.type) {
    //   updatedFields.type = req.body.type
    // }
    if (req.body.gender) {
      updatedFields.gender = req.body.gender
    }
    if (req.body.color) {
      updatedFields.color = req.body.color
    }
    if (req.body.description) {
      updatedFields.description = req.body.description
    }

    // If there are fields to update, add/update the 'updatedOn' field
    if (Object.keys(updatedFields).length > 0) {
      updatedFields.updatedOn = currentDate
    }

    const updatedStrayAnimal = await StrayAnimal.findByIdAndUpdate(
      req.params.saId,
      { $set: updatedFields },
      { new: true }
    )

    res.json({ message: 'Updated field:', updatedFields })
    // res.json(updatedStrayAnimal)
    console.log('Updated field:', updatedFields)
    console.log('---------------------------------------------')
    console.log('Updated animal:', updatedStrayAnimal)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' })
  }
}

// Delete a stray animal by ID
const deleteStrayAnimal = async (req, res) => {
  console.log('Logged-in user:', req.user)

  try {
    // Retrieve logged-in user's data
    const userId = req.user.userId
    console.log('User ID:', userId)
    // console.log('---------------------------------------------')
    const loggedInUser = await User.findById(userId)

    // Check if the user is logged in
    if (!loggedInUser) {
      console.log('Unauthorized')
      console.log('---------------------------------------------')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const loggedInUserId = loggedInUser._id
    const loggedInUserRole = loggedInUser.role
    console.log('Logged-in ID:', loggedInUserId)
    console.log('Logged-in role:', loggedInUserRole)
    console.log('---------------------------------------------')

    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const existingStrayAnimalOwnerId = existingStrayAnimal.owner.ownerId
    console.log('Animal owner:', existingStrayAnimalOwnerId)
    // console.log('Animal data:', existingStrayAnimal)
    console.log('---------------------------------------------')

    // Check if the authenticated user is an admin
    if (loggedInUserRole !== 'admin' && existingStrayAnimalOwnerId !== userId) {
      console.log('You are not authorized to edit this animal')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to edit this animal' })
    }

    const saId = req.params.saId
    console.log('Animal:', req.params)

    const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(saId)

    res.json({ message: 'Stray animal deleted:', deletedStrayAnimal })
    console.log('Animal deleted', deletedStrayAnimal)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error deleting stray animal' })
  }
}

// ------------------Request Adoption----------------------------------
// const { getImageFromBlob } = require('../services/azureBlobService');

// async function getImage(req, res) {
//   try {
//     const fileName = req.params.fileName; // Assuming you pass the file name as a parameter
//     const containerName = req.params.containerName; // Assuming you pass the container name as a parameter

//     const imageData = await getImageFromBlob(fileName, containerName);

//     // Set response content type as image/jpeg (or appropriate content type based on your image)
//     res.writeHead(200, {
//       'Content-Type': 'image/jpeg',
//       'Content-Length': imageData.length,
//     });
//     res.end(imageData);
//   } catch (error) {
//     console.error('Error retrieving image', error);
//     res.status(500).json({ error: 'Failed to retrieve image' });
//   }
// }

// Post adoption request for a stray animal by ID
const requestAdoption = async (req, res) => {
  console.log('Animal:', req.params)
  console.log('Logged-in user:', req.user)
  // console.log(req.body)
  console.log('---------------------------------------------')

  try {
    // Check if the user is logged in
    if (!req.user) {
      console.log('Unauthorized')
      console.log('---------------------------------------------')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Retrieve logged-in user's data
    const loggedInUserId = req.user.userId
    // Fetch user data from the database
    const loggedInUser = await User.findById(loggedInUserId)

    if (!loggedInUser) {
      console.log('Logged-in user not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Logged-in user not found' })
    }

    // Retrieve stray animal data
    const dataInStrayAnimal = req.params.saId
    // Fetch user data from the database
    const dataInSaId = await StrayAnimal.findById(dataInStrayAnimal)

    if (!dataInSaId) {
      console.log('Animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Data stray animal not found' })
    }

    const { reqAddress, reqPhone, reqIdCard, note } = req.body

    // Create a new adoption request
    const adoptionRequest = new AdoptionRequest({
      owner: {
        ownerId: dataInSaId.owner.ownerId,
        ownerUsername: dataInSaId.owner.ownerUsername,
        phoneNumber: dataInSaId.owner.phoneNumber,
      },
      animal: {
        saId: dataInSaId._id,
      },
      requester: {
        reqId: loggedInUser._id,
        reqUsername: loggedInUser.username,
        reqName: loggedInUser.name,
        reqAddress: loggedInUser.userAddress,
        reqPhone: loggedInUser.phoneNumber,
        reqIdCard: loggedInUser.idCard,
      },
      note,
      createdOn: new Date(),
    })

    // Save the adoption request to the database
    await adoptionRequest.save()

    res.status(201).json({
      message: 'Adoption request submitted successfully:',
      adoptionRequest,
    })
    console.log('Adoption request submitted successfully:', adoptionRequest)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Unable to submit adoption request', error)
    res.status(500).json({ message: 'Unable to submit adoption request' })
  }
}

module.exports = {
  getAllStrayAnimals,
  getStrayAnimalById,
  createStrayAnimal,
  updateStrayAnimal,
  deleteStrayAnimal,
  requestAdoption,
  // uploadImage,
  // getImage,
}
