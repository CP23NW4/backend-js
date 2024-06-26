// strayAnimalController.js for handling operations related to stray animals.
require('dotenv').config({ path: '../.env' })

// Import models
const StrayAnimal = require('../models/StrayAnimal')
const User = require('../models/User')
const AdoptionRequest = require('../models/AdoptionRequest')
const Comment = require('../models/Comment')

// Import services
const azureBlobService = require('../services/azureBlobService')
const loggedInUserService = require('../services/loggedInUserService')

const { validationResult } = require('express-validator')

//----------------- Validation function --------------------------------------------------
const validate = (req, res, next) => {
  const errors = validationResult(req).formatWith(({ value, msg }) => ({
    value,
    msg,
  }))
  console.log('---------------------------------------------')
  console.log('errors:', errors.array())
  console.log('---------------------------------------------')
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next() // Call next middleware if validation passes
}

//----------------- Get all stray animals --------------------------------------------------
const getAllStrayAnimals = async (req, res) => {
  try {
    // Retrieve all stray animals with status 'Available' sorted by 'createdOn' in descending order
    const allStrayAnimals = await StrayAnimal.find({ status: 'Available' })
      .sort({ createdOn: -1 })
      .populate('owner', 'username userAddress')

    if (!allStrayAnimals) {
      console.log('Stray animal and Comment not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal and Comment not found' })
    }

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
    .sort({ createdOn: -1 })
    .populate('owner', ' username userAddress userPicture')

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

// ----------------- Get stray animal filter by type Dog ---------------------------------
const getAllStrayAnimalDogs = async (req, res) => {
  try {
    const allStrayDogs = await StrayAnimal.find({ type: 'Dog', status: 'Available' })
    .sort({ createdOn: -1 })
    .populate('owner', ' username userAddress')

    if (!allStrayDogs) {
      console.log('Animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    res.json(allStrayDogs)
    console.log('All post stray dogs:', allStrayDogs)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log('Can not get animals')
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// ----------------- Get stray animal filter by type Cat ---------------------------------
const getAllStrayAnimalCats = async (req, res) => {
  try {
    const allStrayCats = await StrayAnimal.find({ type: 'Cat', status: 'Available' })
    .sort({ createdOn: -1 })
    .populate('owner', ' username userAddress')

    if (!allStrayCats) {
      console.log('Animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }
    res.json(allStrayCats)
    console.log('All post stray cats:', allStrayCats)
    console.log('---------------------------------------------')
  } catch (err) {
    console.log('Can not get animals')
    console.log('---------------------------------------------')
    res.status(500).json({ message: err.message })
  }
}

// ----------------- Get posts of stray animals filter by Unavailable (Adopted) --------------------------
const getAdoptedStrayAnimals = async (req, res) => {
  try {
    const adoptedStrayAnimals = await StrayAnimal.find({ status: 'Unavailable' })
    .sort({ createdOn: -1 })
    .populate('owner', ' username userAddress')
    
    if (!adoptedStrayAnimals) {
      console.log('Animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }
    res.json(adoptedStrayAnimals)
    console.log('Get all adopted animals:', adoptedStrayAnimals);
    console.log('---------------------------------------------')
  } catch (err) {
    console.log('Error fetching adopted animals')
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

    // Call the validation function
    validate(req, res, async () => {
      const { name, type, gender, color, description } = req.body
      const { userId } = req.user // Retrieve user data

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
        owner: userId,
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
    })
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

// ----------------- Update a stray animal by ID --------------------------------------------
const updateStrayAnimal = async (req, res) => {
  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)
    const loggedInUserRole = loggedInUser.role

    // Call the validation function
    validate(req, res, async () => {
      const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

      if (!existingStrayAnimal) {
        console.log('Stray animal not found')
        console.log('---------------------------------------------')
        return res.status(404).json({ message: 'Stray animal not found' })
      }

      const existingStrayAnimalOwnerId = existingStrayAnimal.owner
      console.log('Animal owner:', existingStrayAnimalOwnerId)
      console.log('---------------------------------------------')

      // Check if the authenticated user is an admin
      if (
        loggedInUserRole !== 'admin' &&
        existingStrayAnimal.owner.toString() !== loggedInUser._id.toString()
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
      if (req.body.gender) {
        updatedFields.gender = req.body.gender
      }
      if (req.body.color) {
        updatedFields.color = req.body.color
      }
      if (req.body.description) {
        updatedFields.description = req.body.description
      }
      if (req.body.status) {
        updatedFields.status = req.body.status
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
    })
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' })
  }
}

//----------------- Delete a stray animal by ID -----------------------------------------------
const deleteStrayAnimal = async (req, res) => {
  try {
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUserRole = loggedInUser.role
    const loggedInUserId = req.user.userId

    const existingStrayAnimal = await StrayAnimal.findById(req.params.saId)

    if (!existingStrayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const existingStrayAnimalOwnerId = existingStrayAnimal.owner
    console.log('Logged-in user ID:', loggedInUserId)

    // Check if the logged-in user is an admin or the owner of the stray animal post
    if (
      req.user.role !== 'admin' && 
      existingStrayAnimal.owner.toString() !== loggedInUserId
  ) {
      return res.status(403)
      .json({ message: 'You are not authorized to delete this animal' })
    }

    const saId = req.params.saId
    console.log('Animal ID:', saId)
    console.log('Owner ID:', existingStrayAnimalOwnerId)
    console.log('---------------------------------------------')

    const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(saId)

    // Delete comments associated with the deleted stray animal
    await Comment.deleteMany({ post: saId })

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
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)    // Retrieve the logged-in user data
    const { saId } = req.params

    // Check if picture size exceeds the limit
    if (req.file && req.file.size > 3 * 1024 * 1024) {
      console.log('Image size should be less than 3MB.')
      console.log('---------------------------------------------')
      return res
        .status(400)
        .json({ message: 'Image size should be less than 3MB.' })
    }

    // Call the validation function
    validate(req, res, async () => {

    // Check if the stray animal exists
    const strayAnimal = await StrayAnimal.findById(saId);
    if (!strayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    // Check if the owner of the stray animal still exists
    const ownerExists = await User.exists({ _id: strayAnimal.owner })
    if (!ownerExists) {
      return res
      .status(403)
      .json({ message: 'Cannot request adoption for this post as the owner no longer exists' })
    }

    // Check if the user is the owner of the stray animal
    if (strayAnimal.owner.toString() === loggedInUser._id.toString()) {
      return res
      .status(403)
      .json({ message: 'Owners cannot request adoption for their own stray animals' })
    }

    // Check if the requester has already submitted an adoption request for this stray animal
    const existingRequest = await AdoptionRequest.findOne({ requester: loggedInUser._id, animal: req.params.saId })
    if (existingRequest) {
      return res
      .status(400)
      .json({ message: 'User can requesting to adopt a stray animal can submit only one request per post' })
    }

    const { contact, salary, note, homePicture } = req.body

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

    // Create the adoption request
    const adoptionRequest = new AdoptionRequest({
      owner: strayAnimal.owner,
      animal: saId,
      requester: loggedInUser._id,
      contact,
      salary,
      note,
      homePicture,
      createdOn: new Date(),
    });

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
        'Adoption request submitted successfully:',
        adoptionRequest
      )
    console.log('---------------------------------------------')
  })
  } catch (error) {
    console.error('Unable to submit adoption request', error)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to submit adoption request' })
  }
}


// Helper function to check if a URL is external
function isExternalUrl(url) {
  return /^(https?:\/\/|www\.)\S+$/.test(url)
}

// ----------------- Edit status adoption request for a stray animal by ID -------------------------------------------
const updateAdoptionRequestStatus = async (req, res) => {
  try {
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)    // Retrieve the logged-in user's data

    // Call the validation function
    validate(req, res, async () => {
      const adoptionRequest = await AdoptionRequest.findById(req.params.reqId)      // Fetch the adoption request by ID

      if (!adoptionRequest) {
        return res.status(404).json({ message: 'Adoption request not found' })
      }

      // Check if the logged-in user has permission to edit the status
      if (
        adoptionRequest.owner.toString() !== loggedInUser._id.toString()
      ) {
        return res
        .status(403)
        .json({ message: 'You are not authorized to edit the status of this adoption request' })
      }

      // Update the status of the adoption request
      const newStatus = req.body.status
      adoptionRequest.status = newStatus
      adoptionRequest.updatedOn = new Date()
      await adoptionRequest.save()

      if (newStatus === 'Accepted') {
        // If the adoption request status is "Accepted," update the stray animal status to "Unavailable"
        const strayAnimal = await StrayAnimal.findById(adoptionRequest.animal)
        if (strayAnimal) {
          strayAnimal.status = 'Unavailable'
          await strayAnimal.save()

          // Reject all other adoption requests for the same stray animal
          await AdoptionRequest.updateMany(
            {
              animal: adoptionRequest.animal,
              _id: { $ne: adoptionRequest._id }, // Exclude the current request
              status: { $ne: 'Accepted' }, // Exclude already accepted requests
            },
            { status: 'Rejected', updatedOn: new Date() }
          )
        }
      }

      // Respond with the updated adoption request status
      const updateStatus = {
        status: adoptionRequest.status,
        _id: adoptionRequest._id,
        updatedOn: adoptionRequest.updatedOn,
      }

      res.json({ message: 'Updated adoption request status:', updateStatus })
      console.log
      (
        'Updated adoption request status successfully by:',
        loggedInUser.username
      )
      console.log('---------------------------------------------')
      console.log('Updated adoption request status successfully:', adoptionRequest)
    })
  } catch (error) {
    console.error('Error updating adoption request status:', error)
    res.status(500).json({ message: 'Error updating adoption request status' })
  }
}

// ----------------- GET animal post by Owner -------------------------------------------
async function getAnimalPostsByOwner(ownerId) {
  try {
    // Query stray animals collection based on owner's ID
    const animalPosts = await StrayAnimal.find({ 'owner': ownerId })
    .sort({ createdOn: -1 })
    .populate('owner', 'username')
    return animalPosts
  } catch (error) {
    console.log(error)
    console.log('---------------------------------------------')
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

const getAdoptionRequestsByLoggedInUser = async (req, res) => {
  try {
    // Retrieve the logged-in user's ID
    const loggedInUserId = req.user.userId
    
    // Query adoption requests made by the logged-in user and populate the animal field
    const adoptionRequests = await AdoptionRequest.find({ requester: loggedInUserId })
      .sort({ createdOn: -1 })
      .populate({
        path: 'animal',
        select: '_id name picture type gender color description owner createdOn', // Specify the fields to populate
        populate: {
          path: 'owner',
          select: 'username', // Include owner's username
        },
      });

    if (!adoptionRequests) {
      console.log('Adoption requests not found')
      return res.status(404).json({ message: 'Adoption requests not found' })
    }

    // Format the data for response
    const formattedAdoptionRequests = adoptionRequests.map((request) => {
      const { animal, status } = request
      const { _id, name, picture, type, gender, color, description, createdOn } = animal
      const ownerUsername = animal.owner ? animal.owner.username : null

      return {
        _id: request._id, // Show adoption request's _id
        animal: {
          _id,
          name,
          picture,
          type,
          gender,
          color,
          description,
          ownerUsername,
          createdOn,
        },
        status,
      }
    })

    // Send the formatted adoption requests as a JSON response
    res.json(formattedAdoptionRequests)
    console.log('Get adoption request by requester:', formattedAdoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error fetching adoption requests:', error)
    res.status(500).json({ message: 'Error fetching adoption requests' })
  }
}

// ----------------- Get adoption requests filter by ID stray animal post ------------------------------
const getAdoptionRequestsBysaId = async (req, res) => {
  try {
    const saId = req.params.saId // Retrieve the owner's post ID from the request parameters
    const loggedInUserId = req.user.userId // Retrieve the logged-in user's ID

    // Query the StrayAnimal collection to find the owner's ID associated with the specified post ID
    const strayAnimal = await StrayAnimal.findById(saId)
    if (!strayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }
 
    // Check if the logged-in user is the owner of the stray animal
    if (strayAnimal.owner.toString() !== loggedInUserId) {
      return res.status(403).json({ message: 'You are not authorized to view adoption requests for this stray animal' });
    }

    // Find adoption requests for the specified stray animal ID
    const adoptionRequests = await AdoptionRequest.find({ animal: saId })
    .populate('requester', ' _id username name userAddress phoneNumber userPicture') // Populate requester field with specific fields
    .populate('animal') // Optional: populate animal field if needed
    // .populate('owner') // Optional: populate owner field if needed
    .sort({ createdOn: -1 })

        // Format the response to include the desired fields
        const formattedResponse = adoptionRequests.map((request) => ({
          _id: request._id,
          animal: {
            name: request.animal.name,
            status: request.animal.status,
            createdOn: request.animal.createdOn,
          },
          requester: {
            reqId: request.requester._id,
            reqUsername: request.requester.username,
            reqName: request.requester.name,
            reqAddress: request.requester.userAddress,
            reqPhone: request.requester.phoneNumber,
            reqPicture: request.requester.userPicture,
          },
            contact: request.contact,
            salary: request.salary,
            note: request.note,
            homePicture: request.homePicture,
            status: request.status,
            createdOn: request.createdOn,
        }))


    // Return the adoption requests for the specified stray animal post
    res.json(formattedResponse)
    console.log('Get adoption requests for stray animal post:', formattedResponse)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption requests for stray animal post:', error)
    res.status(500).json({ message: 'Error retrieving adoption requests' })
  }
}

// ----------------- GET adoption requests form (Sender) by ID --------------------------
const getAdoptionRequestByIdForSender = async (req, res) => {
  try {
    const { reqId } = req.params // Extract adoption request ID from request parameters

    // Find the adoption request by its ID and populate related data
    const adoptionRequest = await AdoptionRequest.findById(reqId)
      .populate('animal') // Populate the stray animal details
      .populate('requester', 'username name userAddress phoneNumber userPicture') // Populate requester details
      .populate('owner', 'username userPicture') // Populate owner details

    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Adoption request not found' })
    }

    // Prepare the response object
    const adoptionRequests = {
      // Stray animal information
      owner:{
        ownerUsername: adoptionRequest.owner.username,
        ownerPicture: adoptionRequest.owner.userPicture,
      },
      animal: {
        name: adoptionRequest.animal.name,
        picture: adoptionRequest.animal.picture,
        type: adoptionRequest.animal.type,
        gender: adoptionRequest.animal.gender,
        color: adoptionRequest.animal.color,
        description: adoptionRequest.animal.description,
        status: adoptionRequest.animal.status,
        createdOn: adoptionRequest.animal.createdOn,
      },
      // Requester information
      requester: {
        reqId: adoptionRequest.requester._id,
        reqUsername: adoptionRequest.requester.username,
        reqName: adoptionRequest.requester.name,
        reqAddress: adoptionRequest.requester.userAddress,
        reqPhone: adoptionRequest.requester.phoneNumber,
        reqPicture: adoptionRequest.requester.userPicture,
        contact: adoptionRequest.contact,
        salary: adoptionRequest.salary,
        note: adoptionRequest.note,
        homePicture: adoptionRequest.homePicture,
        status: adoptionRequest.status,
        createdOn: adoptionRequest.createdOn,
      }
    }

    // Return the adoption request
    res.json(adoptionRequests)
    console.log('Get adoption request by ID for sender:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption request:', error)
    res.status(500).json({ message: 'Error retrieving adoption request' })
  }
}

// ----------------- Create a new comment --------------------------
const createComment = async (req, res) => {
  console.log('Creating a new comment')
  try {
    // Call the validation function
    validate(req, res, async () => {
    const { saId } = req.params // Retrieve stray animal data
    const { userId } = req.user // Retrieve user data
    const { comment } = req.body

    // Fetch stray animal data from the database
    const strayAnimal = await StrayAnimal.findById(saId)
    if (!strayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    // Create a new comment
    const addComment = new Comment({
      post: saId,
      user: userId,
      comment: comment
    })
    await addComment.save()

    res.status(201).json(addComment)
    console.log('---------------------------------------------')
    console.log('Comment created successfully by: ', req.user.username)
    console.log('---------------------------------------------')
    console.log('Comment: ', addComment.comment)
    console.log('---------------------------------------------')
    console.log('saId', addComment.post.saId)
    console.log('UserId', addComment.user.userId)


  })
  } catch (error) {
    console.error('Error creating comment:', error.message)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to create comment' })
  }
}

// ----------------- Get comments for a post --------------------------
const getComments = async (req, res) => {
  try {
    const { saId } = req.params

    const strayAnimal = await StrayAnimal.findById(saId)
    if (!strayAnimal) {
      console.log('Stray animal and Comment not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal and Comment not found' })
    }
        // Find comments for the given stray animal post ID
        const comments = await Comment.find({ post: saId })
        .populate({
          path: 'user',
          select: 'userId username userPicture',
          model: User,
        }).sort({ createdOn: -1 })
    
    res.json(comments)
    console.log('Comments fetched successfully', comments)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Can not get this comment :', error.message)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to fetch comments' })
  }
}

// ----------------- Delete comment by ID --------------------------
const deleteComment = async (req, res) => {
  console.log('Deleting a comment')
  try {
    const { commentId } = req.params
    const userId = req.user.userId // Retrieve the user ID from the request

    // Find the comment by ID
    const comment = await Comment.findById(commentId)

    // Check if the comment exists
    if (!comment) {
      console.log('Comment not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Comment not found' })
    }
    
    // Check if the authenticated user is the owner of the comment
    if (comment.user.toString() !== userId) {
      console.log('Unauthorized: Only the owner can delete the comment')
      console.log('---------------------------------------------')
      return res.status(403).json({ message: 'Unauthorized: Only the owner can delete the comment' })
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId)

    console.log('Comment deleted successfully')
    res.json({ message: 'Comment deleted successfully' })
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error deleting comment:', error.message)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to delete comment' })
  }
}


module.exports = {
  validate,
  getAllStrayAnimals,
  getStrayAnimalById,
  getAllStrayAnimalDogs,
  getAllStrayAnimalCats,
  getAdoptedStrayAnimals,
  createStrayAnimal,
  updateStrayAnimal,
  deleteStrayAnimal,
  requestAdoption,
  updateAdoptionRequestStatus,
  getAnimalPostsByLoggedInUser,
  getAdoptionRequestsByLoggedInUser,
  getAdoptionRequestByIdForSender,
  getAdoptionRequestsBysaId,
  createComment,
  getComments,
  deleteComment,
}
