// strayAnimalController.js for handling operations related to stray animals.

const { validationResult } = require('express-validator');
const StrayAnimal = require('../models/StrayAnimal');
const azureBlobService = require('../services/azureBlobService');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });
const fs = require('fs');


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
  
    const { name, picture, type, gender, color, description } = req.body;

    // Handle image upload to Azure Blob Storage
    try {
      let imageUrl;
  
      if (isExternalUrl(picture)) {
        // If the picture is an external URL, use it directly
        imageUrl = picture;
      } else {
        // If the picture is a local file path, upload it to Azure Blob Storage
        const imageBuffer = await readFileAsync(picture);
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`; // Change the filename as per your requirements
  
        // Upload image to Azure Blob Storage
        await azureBlobService.uploadImageToBlob(imageBuffer, fileName);
  
        // Set the imageUrl as the Blob URL
        imageUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER}/${fileName}`;
      }

    // Create a new stray animal with the Azure Blob Storage URL
    const newStrayAnimal = new StrayAnimal({
      name,
      // picture: `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER}/${fileName}`,
      picture: imageUrl,
      type,
      gender,
      color,
      description,
      createdOn: new Date(),
    });

      // Save the stray animal to the database
      const savedStrayAnimal = await newStrayAnimal.save();

      res.status(201).json(savedStrayAnimal);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Unable to create a new stray animal' });
    }
  };

  // Helper function to check if a URL is external
function isExternalUrl(url) {
  return /^(https?:\/\/|www\.)\S+$/.test(url);
}

// Helper function to read a file asynchronously
function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

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

  // ------------------------------------------------------------------
  const { uploadImageToBlob } = require('../services/azureBlobService'); // Adjust the path as needed

    // async function uploadImage(req, res) {
    //   try {
    //     const imageData = req.file.buffer; // Assuming you're using multer or similar for file upload
    //     const fileName = req.file.originalname;

    //     const uploadResponse = await uploadImageToBlob(imageData, fileName);
    //     console.log('Image uploaded to Azure Blob Storage:', uploadResponse);

    //     // Handle other tasks (e.g., saving image URL in your database, responding to the client, etc.)
    //     res.status(200).json({ message: 'Image uploaded successfully', url: uploadResponse.url });
    //   } catch (error) {
    //     console.error('Error uploading image', error);
    //     res.status(500).json({ error: 'Failed to upload image' });
    //   }
    // }


    // ------------------------------------------------------------------
    const { getImageFromBlob } = require('../services/azureBlobService');

    async function getImage(req, res) {
      try {
        const fileName = req.params.fileName; // Assuming you pass the file name as a parameter
        const imageData = await getImageFromBlob(fileName);
    
        // Set response content type as image/jpeg (or appropriate content type based on your image)
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Content-Length': imageData.length,
        });
        res.end(imageData);
      } catch (error) {
        console.error('Error retrieving image', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
      }
    }


  module.exports = {
    getAllStrayAnimals,
    getStrayAnimalById,
    createStrayAnimal,
    updateStrayAnimal,
    deleteStrayAnimal,
    // uploadImage,
    getImage,
  };

  