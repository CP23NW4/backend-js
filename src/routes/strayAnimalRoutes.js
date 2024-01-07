// strayAnimalRoutes.js for defining the routes related to stray animals.

const express = require('express');
const { body, validationResult } = require('express-validator');
const StrayAnimal = require('../models/StrayAnimal');
const strayAnimalController = require('../controllers/strayAnimalController');

const router = express.Router();

router.get('/', strayAnimalController.getAllStrayAnimals);
router.get('/:saId', strayAnimalController.getStrayAnimalById);

router.post(
  '/',
  [
    body('name').notEmpty().isLength({ min: 1, max: 20 }).matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/),
    body('picture').notEmpty(),
    body('type').notEmpty().isIn(['Dog', 'Cat']).isLength({ max: 5 }),
    body('gender').notEmpty().isIn(['Male', 'Female']).isLength({ max: 6 }),
    body('color').notEmpty().matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/).custom(value => !/\d/.test(value)),
    body('description').isLength({ max: 500 }),
  ],
  strayAnimalController.createStrayAnimal
);

router.put(
  '/:saId',
  [
    body('name').optional().isLength({ min: 1, max: 20 }).matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/),
    body('picture').optional().notEmpty(),
    body('type').optional().isIn(['Dog', 'Cat']).isLength({ max: 5 }),
    body('gender').optional().isIn(['Male', 'Female']).isLength({ max: 6 }),
    body('color').optional().matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/).custom(value => !/\d/.test(value)),
    body('description').optional().isLength({ max: 500 }),
  ],
  strayAnimalController.updateStrayAnimal
);

router.delete('/:saId', strayAnimalController.deleteStrayAnimal);

// --------------------------------------------------------------

const multer = require('multer'); // Assuming you use multer for file uploads

const upload = multer(); // Set up multer middleware for handling multipart/form-data

router.post('/upload-image', upload.single('picture'), strayAnimalController.uploadImage);
// Route to get an image by file name
router.get('/get-image/:fileName', strayAnimalController.getImage);


module.exports = router;
