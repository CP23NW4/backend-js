// strayAnimalController.js for handling operations related to stray animals.

const { validationResult } = require('express-validator')
const StrayAnimal = require('../models/StrayAnimal')
const User = require('../models/User')
const azureBlobService = require('../services/azureBlobService')
const axios = require('axios')
require('dotenv').config({ path: '../.env' })
const fs = require('fs')
const AdoptionRequest = require('../models/AdoptionRequest')

const { uploadImageToBlob } = require('../services/azureBlobService') // Adjust the path as needed

// Get all stray animals
const getAllStrayAnimals = async (req, res) => {
  try {
    const allStrayAnimals = await StrayAnimal.find().sort({ createdOn: -1 })
    res.json(allStrayAnimals)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get animal by ID
const getStrayAnimalById = async (req, res) => {
  try {
    const strayAnimalbyId = await StrayAnimal.findById(req.params.saId)
    if (!strayAnimalbyId) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }
    res.json(strayAnimalbyId)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Create a new stray animal
const createStrayAnimal = async (req, res) => {
  console.log('Request Body:', req.body)
  console.log('Request File:', req.file)
  console.log('Request User:', req.user)

  try {
    // Check if the user is logged in
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Retrieve logged-in user's data
    const loggedInUserId = req.user.userId

    // Fetch user data from the database
    const loggedInUser = await User.findById(loggedInUserId)

    if (!loggedInUser) {
      return res.status(404).json({ message: 'Logged-in user not found' })
    }

    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 11 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: 'Image size should be less than 11MB.' })
    }

    const { name, picture, type, gender, color, description } = req.body

    // Handle image upload to Azure Blob Storage
    // Determine the container based on the animal type
    let containerName
    if (type.toLowerCase() === 'dog') {
      containerName = 'dogs'
    } else if (type.toLowerCase() === 'cat') {
      containerName = 'cats'
    } else {
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
      },
      createdOn: new Date(),
    })

    // Save the stray animal to the database
    const savedStrayAnimal = await newStrayAnimal.save()

    res.status(201).json(savedStrayAnimal)
  } catch (error) {
    console.error(error)
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

    return res.status(400).json(specificErrors)
  }

  try {
    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const updatedFields = {}
    const currentDate = new Date()

    if (req.body.name) {
      updatedFields.name = req.body.name
    }
    if (req.body.picture) {
      updatedFields.picture = req.body.picture
    }
    if (req.body.type) {
      updatedFields.type = req.body.type
    }
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

    res.json(updatedStrayAnimal)
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' })
  }
}

// Delete a stray animal by ID
const deleteStrayAnimal = async (req, res) => {
  try {
    const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(
      req.params.saId
    )

    if (!deletedStrayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    res.json({ message: 'Stray animal deleted' })
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
  console.log('reqbody', req.params)
  console.log('user', req.user)
  console.log(req.body)

  try {
    // Check if the user is logged in
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Retrieve logged-in user's data
    const loggedInUserId = req.user.userId
    // Fetch user data from the database
    const loggedInUser = await User.findById(loggedInUserId)

    if (!loggedInUser) {
      return res.status(404).json({ message: 'Logged-in user not found' })
    }

    // Retrieve stray animal data
    const dataInStrayAnimal = req.params.saId
    // Fetch user data from the database
    const dataInSaId = await StrayAnimal.findById(dataInStrayAnimal)

    if (!dataInSaId) {
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

    res.status(201).json({ message: 'Adoption request submitted successfully:', adoptionRequest })
    console.log('Adoption request submitted successfully:', adoptionRequest)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to submit adoption request:', error })
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
