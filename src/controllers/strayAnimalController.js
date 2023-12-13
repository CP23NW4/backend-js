// strayAnimalController.js for handling operations related to stray animals.

const { validationResult } = require('express-validator');
const StrayAnimal = require('../models/StrayAnimal');


// Get all stray animals
const getAllStrayAnimals = async (req, res) => {
    try {
      const allStrayAnimals = await StrayAnimal.find().sort({ createdOn: -1 });
      res.json(allStrayAnimals);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };


  // Get animal by ID
const getStrayAnimalById = async (req, res) => {
    try {
      const strayAnimalbyId = await StrayAnimal.findById(req.params.saId);
      if (!strayAnimalbyId) {
        return res.status(404).json({ message: 'Stray animal not found' });
      }
      res.json(strayAnimalbyId);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Create a new stray animal
const createStrayAnimal = async (req, res) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({ errorMessages: error.msg }));
      return res.status(400).json(errorMessages);
    }
  
    const newStrayAnimal = new StrayAnimal({
      ...req.body,
      createdOn: new Date(),
    });

    try {
        const savedStrayAnimal = await newStrayAnimal.save();
        res.status(201).json(savedStrayAnimal);
      } catch (err) {
        res.status(400).json({ message: 'Unable to create a new stray animal' });
      }
    };

    // Update a stray animal by ID
const updateStrayAnimal = async (req, res) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      const specificErrors = {};
  
      errors.array().forEach(error => {
        if (!specificErrors[error.param]) {
          specificErrors[error.param] = error.msg;
        }
      });
  
      return res.status(400).json(specificErrors);
    }
  
    try {
      const existingStrayAnimal = await StrayAnimal.findById(req.params.saId);
  
      if (!existingStrayAnimal) {
        return res.status(404).json({ message: 'Stray animal not found' });
      }

      const updatedFields = {};
      const currentDate = new Date();

      if (req.body.name) {
        updatedFields.name = req.body.name;
      }
      if (req.body.picture) {
        updatedFields.picture = req.body.picture;
      }
      if (req.body.type) {
        updatedFields.type = req.body.type;
      }
      if (req.body.gender) {
        updatedFields.gender = req.body.gender;
      }
      if (req.body.color) {
        updatedFields.color = req.body.color;
      }
      if (req.body.description) {
        updatedFields.description = req.body.description;
      }

      // If there are fields to update, add/update the 'updatedOn' field
      if (Object.keys(updatedFields).length > 0) {
        updatedFields.updatedOn = currentDate;
      }

      const updatedStrayAnimal = await StrayAnimal.findByIdAndUpdate(
        req.params.saId,
        { $set: updatedFields },
        { new: true }
      );

      res.json(updatedStrayAnimal);
  } catch (err) {
    res.status(500).json({ message: 'Error updating stray animal' });
  }
};


// Delete a stray animal by ID
const deleteStrayAnimal = async (req, res) => {
    try {
      const deletedStrayAnimal = await StrayAnimal.findByIdAndDelete(req.params.saId);
  
      if (!deletedStrayAnimal) {
        return res.status(404).json({ message: 'Stray animal not found' });
      }
  
      res.json({ message: 'Stray animal deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting stray animal' });
    }
  };


  module.exports = {
    getAllStrayAnimals,
    getStrayAnimalById,
    createStrayAnimal,
    updateStrayAnimal,
    deleteStrayAnimal,
  };

  