// strayAnimalController.js for handling operations related to stray animals.
require('dotenv').config({ path: '../.env' })

// Import models
const StrayAnimal = require('../models/StrayAnimal')
const User = require('../models/User')
const AdoptionRequest = require('../models/AdoptionRequest')

// Import services
const azureBlobService = require('../services/azureBlobService')
const loggedInUserService = require('../services/loggedInUserService')

const { validationResult } = require ('express-validator')

//----------------- Get all stray animals --------------------------------------------------
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

//----------------- Get animal by ID ---------------------------------------------------------
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

//----------------- Create a new stray animal --------------------------------------------
const createStrayAnimal = async (req, res) => {
  console.log('Request File:', req.file)
  console.log('---------------------------------------------')

  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    if (!req.file) {
      console.log('Picture is required.')
      console.log('---------------------------------------------')
      return res.status(400).json({ message: 'Picture is required.' })
    }

    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 3 * 1024 * 1024) {
      console.log('Image size should be less than 3MB.')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Image size should be less than 3MB.' })
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
      // Set the imageUrl as the Blob URL
      imageUrl = await azureBlobService.uploadImageToBlob(req, containerName)
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
    console.log(
      'Animal post has been created by:',
      loggedInUser.username,
      savedStrayAnimal
    )
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

//----------------- Update a stray animal by ID --------------------------------------------
const updateStrayAnimal = async (req, res) => {
  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInUserId = loggedInUser._id.toString()

    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const existingStrayAnimalOwnerId = existingStrayAnimal.owner.ownerId
    console.log('Animal owner:', existingStrayAnimalOwnerId)
    console.log('---------------------------------------------')

    // Check if the authenticated user is an admin
    if (
      loggedInUserRole !== 'admin' &&
      existingStrayAnimalOwnerId !== loggedInUserId
    ) {
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
    console.log('Updated field:', updatedFields)
    console.log('---------------------------------------------')
    console.log('Updated animal:', updatedStrayAnimal)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' })
  }
}

//----------------- Delete a stray animal by ID -----------------------------------------------
const deleteStrayAnimal = async (req, res) => {
  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInUserId = loggedInUser._id.toString()

    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const existingStrayAnimalOwnerId = existingStrayAnimal.owner.ownerId
    console.log('Logged-in user ID:', loggedInUserId)

    // Check if the authenticated user is an admin
    if (
      loggedInUserRole !== 'admin' &&
      existingStrayAnimalOwnerId !== loggedInUserId
    ) {
      console.log('You are not authorized to delete this animal')
      console.log('---------------------------------------------')
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this animal' })
    }

    const saId = req.params.saId
    console.log('Animal ID:', saId)
    console.log('Owner ID:', existingStrayAnimalOwnerId)
    console.log('---------------------------------------------')

    const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(saId)

    res.json({ message: 'Stray animal deleted:', deletedStrayAnimal })
    console.log('Animal deleted by:', loggedInUser.username, deletedStrayAnimal)
    console.log('---------------------------------------------')
  } catch (err) {
    res.status(500).json({ message: 'Error deleting stray animal' })
  }
}

// ----------------- Post adoption request for a stray animal by ID -------------------------------------------
const requestAdoption = async (req, res) => {
  console.log('Request file:', req.file)
  console.log('---------------------------------------------')
  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Validation function
    const errors = validationResult(req).formatWith(({ value, msg }) => ({
      value,
      msg,
    }))
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 3 * 1024 * 1024) {
      console.log('Image size should be less than 3MB.')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Image size should be less than 3MB.' })
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

    const { reqAddress, reqPhone, reqIdCard, note, homePicture } = req.body

    // Upload pic to Blob
    const containerName = 'usershome'
    let imageUrl

    if (homePicture && isExternalUrl(homePicture)) {
      // If the picture is an external URL, use it directly
      imageUrl = req.body.homePicture
    } else if (req.file) {
      // Set the imageUrl as the Blob URL
      imageUrl = await azureBlobService.uploadImageToBlob(req, containerName)
    }

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
      homePicture,
      createdOn: new Date(),
    })

    // Conditionally include homePicture if imageUrl is defined
    if (imageUrl) {
      adoptionRequest.homePicture = imageUrl
    }

    // Create a new AdoptionRequest document
    const newAdoptionRequest = new AdoptionRequest(adoptionRequest)

    // Save the adoption request to the database
    await newAdoptionRequest.save()

    res.status(201).json({
      message: 'Adoption request submitted successfully:',
      adoptionRequest,
    })
    console.log(
      'Adoption request submitted successfully by:',
      loggedInUser.username,
      adoptionRequest
    )
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Unable to submit adoption request', error)
    res.status(500).json({ message: 'Unable to submit adoption request' })
  }
}

// Helper function to check if a URL is external
function isExternalUrl(url) {
  return /^(https?:\/\/|www\.)\S+$/.test(url)
}

// ----------------- GET animal post by Owner -------------------------------------------
async function getAnimalPostsByOwner(ownerId) {
  try {
    // Query stray animals collection based on owner's ID
    const animalPosts = await StrayAnimal.find({ 'owner.ownerId': ownerId })
    return animalPosts
  } catch (error) {
    console.log(error)
    throw error
  }
}

// ----------------- GET animal post by logged-in user -------------------------------------------
async function getAnimalPostsByLoggedInUser(req, res) {
  try {
    // Step 1: Retrieve the logged-in user data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Step 2: Query stray animals collection based on owner's ID
    const animalPosts = await getAnimalPostsByOwner(loggedInUser._id.toString())

    // Step 3: Return the filtered animal posts
    res.json(animalPosts)
    console.log('Posts own by logged-in user:', animalPosts)
    console.log('---------------------------------------------')
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  getAllStrayAnimals,
  getStrayAnimalById,
  createStrayAnimal,
  updateStrayAnimal,
  deleteStrayAnimal,
  requestAdoption,
  getAnimalPostsByLoggedInUser,
}