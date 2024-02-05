// StrayAnimal.js file defines the Mongoose model for the Stray Animal schema.

const mongoose = require('mongoose');

const strayAnimalSchema = new mongoose.Schema({
    name: String,
    picture: String,
    type: String,
    gender: String,
    color: String,
    description: String,
    ownerId: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdOn: Date,
    updatedOn: Date,
});

const StrayAnimal = mongoose.model('StrayAnimal', strayAnimalSchema, 'strayAnimals');

module.exports = StrayAnimal;
