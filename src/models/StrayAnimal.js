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
    enum: ['Available', 'Unavailable'],
    default: 'Available',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
