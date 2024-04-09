// AdoptionRequest.js file defines the Mongoose model for the Stray Animal adoption request schema.
const mongoose = require('mongoose')

const adoptionRequestSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the owner's ID
    ref: 'User'
    // ownerId: String,
    // ownerUsername: String,
    // ownerPicture: String,
    // phoneNumber: String,
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the animal's ID
    ref: 'StrayAnimal'
    // saId: String,
    // saName: String,
    // saPicture: String,
    // saType: String,
    // saGender: String,
    // saColor: String,
    // saDesc: String,
    // saStatus: String,
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the owner's ID
    ref: 'User'
    // reqId: String,
    // reqUsername: String,
    // reqName: String,
    // reqAddress: {
    //   PostCode: String,
    //   TambonThaiShort: String,
    //   DistrictThaiShort: String,
    //   ProvinceThai: String,
    //   homeAddress: String,
    // },
    // reqPhone: String,
    // reqIdCard: String,
    // reqPicture: String,
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
