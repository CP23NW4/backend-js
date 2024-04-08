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

    const allStrayAnimals = await StrayAnimal.find()
    .sort({ createdOn: -1 })
    .populate('owner', ' username userAddress')

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
    .populate('owner', ' username userAddress')

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

//----------------- Update a stray animal by ID --------------------------------------------
const updateStrayAnimal = async (req, res) => {
  try {
    //Call getLoggedInUserDataNoRes to retrieve logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    const loggedInUserRole = loggedInUser.role
    const loggedInUserId = loggedInUser._id.toString()

    // Call the validation function
    validate(req, res, async () => {
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
      // Retrieve stray animal data
      const dataInStrayAnimal = req.params.saId
      // Fetch user data from the database
      const dataInSaId = await StrayAnimal.findById(dataInStrayAnimal)

      if (!dataInSaId) {
        console.log('Animal not found')
        console.log('---------------------------------------------')
        return res.status(404).json({ message: 'Data stray animal not found' })
      }

      // Check if the logged-in user is the owner of the stray animal
      if (loggedInUser._id.toString() === dataInSaId.owner.ownerId) {
        console.log(
          'Owners cannot request adoption for their own stray animals'
        )
        console.log('---------------------------------------------')
        return res.status(403).json({
          message: 'Owners cannot request adoption for their own stray animals',
        })
      }

      const { note, homePicture } = req.body
      // const reqAddress = req.params.loggedInUser.userAddress

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
          ownerPicture: dataInSaId.owner.ownerPicture,
          phoneNumber: dataInSaId.owner.phoneNumber,
        },
        animal: {
          saId: dataInSaId._id,
          saName: dataInSaId.name,
          saPicture: dataInSaId.picture,
          saType: dataInSaId.type,
          saGender: dataInSaId.gender,
          saColor: dataInSaId.color,
          saDesc: dataInSaId.description,
          saStatus: dataInSaId.status,
        },
        requester: {
          reqId: loggedInUser._id,
          reqUsername: loggedInUser.username,
          reqName: loggedInUser.name,
          reqAddress: {
            PostCode: loggedInUser.userAddress.PostCode,
            TambonThaiShort: loggedInUser.userAddress.TambonThaiShort,
            DistrictThaiShort: loggedInUser.userAddress.DistrictThaiShort,
            ProvinceThai: loggedInUser.userAddress.ProvinceThai,
            homeAddress: loggedInUser.userAddress.homeAddress,
          },
          reqPhone: loggedInUser.phoneNumber,
          reqIdCard: loggedInUser.idCard,
          reqPicture: loggedInUser.userPicture,
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
    // Retrieve the logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)
    const loggedInUserRole = loggedInUser.role

    // Call the validation function
    validate(req, res, async () => {

    // Fetch the adoption request by ID
    const adoptionRequest = await AdoptionRequest.findById(req.params.reqId)

    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Adoption request not found' })
    }

    // Check if the logged-in user has permission to edit the status
    if (loggedInUserRole !== 'admin' && adoptionRequest.owner.ownerId !== loggedInUser._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit the status of this adoption request' })
    }

    // Update the status of the adoption request
    adoptionRequest.status = req.body.status
    adoptionRequest.updatedOn = new Date()
    await adoptionRequest.save()

    //  Respond with only required fields
    const updateStatus = {
    status: adoptionRequest.status,
     _id: adoptionRequest._id,
    updatedOn: adoptionRequest.updatedOn
    }

    res.json({ message: 'Updated adoption request status:', updateStatus })
    console.log('Updated adoption request status successfully by:', loggedInUser.username)
    console.log('---------------------------------------------')
    console.log('Updated adoption request status successfully:', adoptionRequest )
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
    const animalPosts = await StrayAnimal.find({ 'owner.ownerId': ownerId }).sort({ createdOn: -1 })
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

// ----------------- GET adoption requests by logged-in user (Sender) ------------------------------
const getAdoptionRequestsByLoggedInUser = async (req, res) => {
  try {
    // Extract the logged-in user's ID from the authentication token
    const loggedInUserId = req.user.userId

    // Query adoption requests collection to find requests matching the logged-in user's ID
    const adoptionRequests = await AdoptionRequest.find({
      'requester.reqId': loggedInUserId,
    }).sort({ createdOn: -1 })

    // Return the adoption requests for the logged-in user
    res.json(adoptionRequests)
    console.log('Get adoption request by requester:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error fetching adoption requests:', error)
    res.status(500).json({ message: 'Error fetching adoption requests' })
  }
}

// ----------------- GET adoption requests by owners post (Receiver) -------------------------------------------
async function getOwnersAdoptionRequestsByLoggedInUser(req, res) {
  try {
    // Step 1: Retrieve the logged-in user data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Step 2: Query adoption requests collection based on the owner's ID (logged-in user's ID)
    const adoptionRequests = await AdoptionRequest.find({
      'owner.ownerId': loggedInUser._id,
    }).sort({ createdOn: -1 })

    // Step 3: Return the adoption requests
    res.json(adoptionRequests)
    console.log('Get adoption requests by owners post:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption requests:', error)
    res.status(500).json({ message: 'Error retrieving adoption requests' })
  }
}

// ----------------- Get adoption requests filter by ID stray animal post ------------------------------
const getAdoptionRequestsBysaId = async (req, res) => {
  try {
    // Retrieve the owner's post ID from the request parameters
    const { saId } = req.params

    // Retrieve the logged-in user's ID
    const loggedInUserId = req.user.userId

    // Query the StrayAnimal collection to find the owner's ID associated with the specified post ID
    const strayAnimal = await StrayAnimal.findById(saId)
    if (!strayAnimal) {
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    const ownerId = strayAnimal.owner.ownerId

    // Validate that the logged-in user's ID matches the owner's ID
    if (loggedInUserId !== ownerId) {
      return res.status(403).json({ message: 'You are not authorized to access adoption requests for this stray animal post' })
    }

    // If validation passes, proceed to fetch adoption requests
    const adoptionRequests = await AdoptionRequest.find({ 'animal.saId': saId }).sort({ createdOn: -1 })

    // Return the adoption requests for the specified stray animal post
    res.json(adoptionRequests)
    console.log('Get adoption requests for stray animal post:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption requests for stray animal post:', error)
    res.status(500).json({ message: 'Error retrieving adoption requests' })
  }
}


// ----------------- GET adoption requests form (Receiver) by ID --------------------------
const getAdoptionRequestById = async (req, res) => {
  try {
    const { reqId } = req.params // Extract adoption request ID from request parameters

    // Retrieve the logged-in user's data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Fetch the adoption request from the database
    const adoptionRequest = await AdoptionRequest.findById(reqId)

    // Check if the adoption request exists
    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Adoption request not found' })
    }

    // Check if the logged-in user is the requester of the adoption request
    if (adoptionRequest.owner.ownerId !== loggedInUser._id.toString()) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this adoption request' 
      })
    }

    // Return the adoption request
    res.json(adoptionRequest)
    console.log('Get adoption requests by owners post:', adoptionRequest)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption request:', error)
    res.status(500).json({ message: 'Error retrieving adoption request' })
  }
}

// ----------------- GET adoption requests form (Sender) by ID --------------------------
const getAdoptionRequestByIdForSender = async (req, res) => {
  try {
    const { reqId } = req.params // Extract adoption request ID from request parameters
    const loggedInUserId = req.user.userId // Extract ID of the logged-in user

    // Fetch the adoption request from the database
    const adoptionRequest = await AdoptionRequest.findById(reqId)

    // Check if the adoption request exists
    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Adoption request not found' })
    }

    // Check if the logged-in user is the requester of the adoption request
    if (adoptionRequest.requester.reqId.toString() !== loggedInUserId) {
      return res.status(403).json({ message: 'You are not authorized to view this adoption request' })
    }

    // Return the adoption request
    res.json(adoptionRequest)
    console.log('Get adoption request by ID for sender:', adoptionRequest)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption request:', error)
    res.status(500).json({ message: 'Error retrieving adoption request' })
  }
}

// ----------------- Create a new comment --------------------------
const createComment = async (req, res) => {
  // console.log('Creating a new comment')
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

// ----------------- Update comment by ID -------------------------- 
// const updateComment = async (req, res) => {
//   console.log('Updating a comment')
//   try {
//     // Call the validation function
//     validate(req, res, async () => {

//     const { commentId } = req.params
//     const { text } = req.body

//     const updatedComment = await Comment.findByIdAndUpdate(
//       commentId,
//       { $set: { text } },
//       { new: true }
//     )
//     if (!updatedComment) {
//       console.log('Stray animal not founnd')
//       console.log('---------------------------------------------')
//       return res.status(404).json({ message: 'Stray animal not found' })
//     }

//     res.json(updatedComment)
//     console.log('---------------------------------------------')
//     console.log('Comment updated successfully: ', updatedComment.text)
//   })
//   } catch (error) {
//     console.error('Error updating comment:', error.message)
//     console.log('---------------------------------------------')
//     res.status(500).json({ message: 'Unable to update comment' })
//   }
// }

// ----------------- Delete comment by ID --------------------------
const deleteComment = async (req, res) => {
  console.log('Deleting a comment')
  try {
    const { commentId } = req.params
    const loggedInUserId = req.user.userId 

    // Find the comment by ID
    const comment = await Comment.findById(commentId)

    // Check if the comment exists
    if (!comment) {
      console.log('Comment not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Check if the logged-in user is the owner of the comment
    if (comment.user.userId !== loggedInUserId) {
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


module.exports = {
  validate,
  getAllStrayAnimals,
  getStrayAnimalById,
  getAllStrayAnimalDogs,
  getAllStrayAnimalCats,
  createStrayAnimal,
  updateStrayAnimal,
  deleteStrayAnimal,
  requestAdoption,
  updateAdoptionRequestStatus,
  getAnimalPostsByLoggedInUser,
  getAdoptionRequestsByLoggedInUser,
  getOwnersAdoptionRequestsByLoggedInUser,
  getAdoptionRequestById,
  getAdoptionRequestByIdForSender,
  getAdoptionRequestsBysaId,
  createComment,
  getComments,
  // updateComment,
  deleteComment,
  getAdoptedStrayAnimals,

}
