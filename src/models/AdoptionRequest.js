// AdoptionRequest.js file defines the Mongoose model for the Stray Animal adoption request schema.
const mongoose = require('mongoose')

const adoptionRequestSchema = new mongoose.Schema({
  owner: {
    ownerId: String,
    ownerUsername: String,
    phoneNumber: String,
  },
  animal: {
    saId: String,
    saName: String,
    saPicture: String,
    saType: String,
    saGender: String,
    saColor: String,
    saDesc: String,
    saStatus: String,
  },
  requester: {
    reqId: String,
    reqUsername: String,
    reqName: String,
    reqAddress: String,
    reqPhone: String,
    reqIdCard: String,
  },
  note: String,
  homePicture: {
    type: String,
    default: null,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
})

const AdoptionRequest = mongoose.model('AdoptionRequest', adoptionRequestSchema)

module.exports = AdoptionRequest
