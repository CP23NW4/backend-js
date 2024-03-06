// StrayAnimal.js file defines the Mongoose model for the Stray Animal schema.

const mongoose = require('mongoose')

const strayAnimalSchema = new mongoose.Schema({
  name: String,
  picture: String,
  type: String,
  gender: String,
  color: String,
  description: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Available', 'Not Available'],
    default: 'Available',
  },
  owner: {
    ownerId: String,
    ownerUsername: String,
    phoneNumber: String,
    role: String,
    ownerAddress: {
      postCode: Number,
      tambonThaiShort: String,
      districtThaiShort: String,
      provinceThai: String,
    },
  },
  createdOn: Date,
  updatedOn: Date,
})

const StrayAnimal = mongoose.model(
  'StrayAnimal',
  strayAnimalSchema,
  'strayAnimals'
)

module.exports = StrayAnimal
