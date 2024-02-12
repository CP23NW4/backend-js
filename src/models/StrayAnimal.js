// StrayAnimal.js file defines the Mongoose model for the Stray Animal schema.

const mongoose = require('mongoose');

const strayAnimalSchema = new mongoose.Schema({
    name: String,
    picture: String,
    type: String,
    gender: String,
    color: String,
    description: String,
    owner: {
        ownerId: String,
        ownerUsername: String,
        phoneNumber: String,
    },
    createdOn: Date,
    updatedOn: Date,
});

const StrayAnimal = mongoose.model('StrayAnimal', strayAnimalSchema, 'strayAnimals');

module.exports = StrayAnimal;
