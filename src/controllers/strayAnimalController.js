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

    // Call the validation function
    validate(req, res, async () => {
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
          ownerAddress: loggedInUser.userAddress,
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

// ----------------- GET animal post by Owner -------------------------------------------
async function getAnimalPostsByOwner(ownerId) {
  try {
    // Query stray animals collection based on owner's ID
    const animalPosts = await StrayAnimal.find({ 'owner.ownerId': ownerId })
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
    })

    // Return the adoption requests for the logged-in user
    res.json(adoptionRequests)
    console.log('Get adoption request by requester:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error fetching adoption requests:', error)
    res.status(500).json({ message: 'Error fetching adoption requests' })
  }
}

// ----------------- GET adoption requests by owners post (Reciever) -------------------------------------------
async function getOwnersAdoptionRequestsByLoggedInUser(req, res) {
  try {
    // Step 1: Retrieve the logged-in user data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Step 2: Query adoption requests collection based on the owner's ID (logged-in user's ID)
    const adoptionRequests = await AdoptionRequest.find({
      'owner.ownerId': loggedInUser._id,
    })

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
    const saId = req.params.saId

    // Retrieve the logged-in user data
    const loggedInUser = await loggedInUserService.getLoggedInUserDataNoRes(req)

    // Query adoption requests collection based on the owner's post ID
    const adoptionRequests = await AdoptionRequest.find({
      'animal.saId': saId,
    })

    // Check if the logged-in user is the owner of the post
    const isOwner = adoptionRequests.some(request => request.owner.ownerId.toString() === loggedInUser._id.toString())
    if (!isOwner) {
      return res.status(403).json({ 
        message: 'You are not authorized to view adoption requests for this post' 
      })
    }

    // Return the adoption requests for the specified stray animal post
    res.json(adoptionRequests)
    console.log('Get adoption requests for stray animal post:', adoptionRequests)
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error retrieving adoption requests for stray animal post:', error)
    res.status(500).json({ message: 'Error retrieving adoption requests' })
  }
}

// ----------------- GET adoption requests by ID --------------------------
const getAdoptionRequestById = async (req, res) => {
  try {
    const adoptionRequest = await AdoptionRequest.findById(req.params.reqId)

    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Adoption request not found' })
    }

    // Ensure that the requester is authorized to view this request
    if (adoptionRequest.requester.reqId.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'You are not authorized to view this adoption request' 
      })
    }

    res.json(adoptionRequest)
    console.log('Get adoption requests by owners post:', adoptionRequest)
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
    const { userId } = req.user // // Retrieve user data
    const { comment } = req.body

    // Fetch stray animal data from the database
    const strayAnimal = await StrayAnimal.findById(saId);
    if (!strayAnimal) {
      console.log('Stray animal not found')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    // Create a new comment
    const addComment = new Comment({
      post: {
        saId: strayAnimal._id,
        saName: strayAnimal.name,
      },
      user: {
        userId,
        username: req.user.username, 
        userPicture: req.user.userPicture,
      },
      comment,
    })
    await addComment.save()

    res.status(201).json(addComment)
    console.log('---------------------------------------------')
    console.log('Comment created successfully by: ', req.user.username
    )
    console.log('Stray Animal Post', addComment.post
    )
    console.log('User', addComment.user)
    console.log('---------------------------------------------')
    console.log('Comment: ', addComment.text)
    console.log('---------------------------------------------')
  })
  } catch (error) {
    console.error('Error creating comment:', error.message)
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to create comment' })
  }
};

// ----------------- Get comments for a post --------------------------
const getComments = async (req, res) => {
  // console.log('Fetching comments for a post')
  // try {
  //   const { saId } = req.params
  //   const comments = await Comment.find({ saId })
  try {
    const { saId } = req.params
    const comments = await Comment.find({ 'post.saId': saId })
    if (!comments) {
      console.log('Stray animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }
    
    res.json(comments)
    console.log('Comments fetched successfully', comments);
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
    await Comment.findByIdAndDelete(commentId)

    if (!commentId) {
      console.log('Stray animal not founnd')
      console.log('---------------------------------------------')
      return res.status(404).json({ message: 'Stray animal not found' })
    }

    console.log('Comment deleted successfully')
    res.json({ message: 'Comment deleted successfully' })
    console.log('---------------------------------------------')
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    console.log('---------------------------------------------')
    res.status(500).json({ message: 'Unable to delete comment' })
  }
}


module.exports = {
  validate,
  getAllStrayAnimals,
  getStrayAnimalById,
  createStrayAnimal,
  updateStrayAnimal,
  deleteStrayAnimal,
  requestAdoption,
  getAnimalPostsByLoggedInUser,
  getAdoptionRequestsByLoggedInUser,
  getOwnersAdoptionRequestsByLoggedInUser,
  getAdoptionRequestById,
  getAdoptionRequestsBysaId,
  createComment,
  getComments,
  // updateComment,
  deleteComment,

}
