// AdoptionRequest.js file defines the Mongoose model for the Stray Animal adoption request schema.
const mongoose = require('mongoose')

const adoptionRequestSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the owner's ID
    ref: 'User'
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the animal's ID
    ref: 'StrayAnimal'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the requester's ID
    ref: 'User'
  },
  contact : String,
  salary: Number,
  note: String,
  homePicture: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['On Request', 'Accepted', 'Reject'],
    default: 'On Request',
  },
  createdOn: Date,
  updatedOn: Date,
})

const AdoptionRequest = mongoose.model('AdoptionRequest', adoptionRequestSchema)

module.exports = AdoptionRequest
