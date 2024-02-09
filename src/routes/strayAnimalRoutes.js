// strayAnimalRoutes.js for defining the routes related to stray animals.

const express = require('express')
const { body, validationResult } = require('express-validator')
const StrayAnimal = require('../models/StrayAnimal')
const strayAnimalController = require('../controllers/strayAnimalController')
const { authenticateUser } = require('../middlewares/userAuthMiddleware');

const router = express.Router()

const multer = require('multer');
const upload = multer(); // create an instance of multer

router.get('/', strayAnimalController.getAllStrayAnimals)
router.get('/:saId', strayAnimalController.getStrayAnimalById)

router.post(
  '/',  upload.single('picture'),
  [
    body('name').notEmpty().isLength({ min: 1, max: 20 }).matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/),
    body('type').notEmpty().isIn(['Dog', 'Cat']).isLength({ max: 5 }),
    body('gender').notEmpty().isIn(['Male', 'Female']).isLength({ max: 6 }),
    body('color').notEmpty().matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/).custom((value, { req }) => {
      // Custom validation for 'picture' field
      if (!req.file) {
        throw new Error('Picture is required.');
      }
      return true;
    }),
    body('description').isLength({ max: 500 }),
  ],
  authenticateUser, strayAnimalController.createStrayAnimal
)

router.put(
  '/:saId',
  [
    body('name')
      .optional()
      .isLength({ min: 1, max: 20 })
      .matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/),
    body('picture').optional().notEmpty(),
    body('type').optional().isIn(['Dog', 'Cat']).isLength({ max: 5 }),
    body('gender').optional().isIn(['Male', 'Female']).isLength({ max: 6 }),
    body('color')
      .optional()
      .matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/)
      .custom((value) => !/\d/.test(value)),
    body('description').optional().isLength({ max: 500 }),
  ],
  authenticateUser, strayAnimalController.updateStrayAnimal
)

router.delete('/:saId', authenticateUser, strayAnimalController.deleteStrayAnimal)

// --------------------------------------------------------------

// const multer = require('multer'); // Assuming you use multer for file uploads

// const upload = multer(); // Set up multer middleware for handling multipart/form-data

// router.post('/upload-image', upload.single('picture'), strayAnimalController.uploadImage);
// Route to get an image by file name
// router.get('/get-image/:containerName:fileName', strayAnimalController.getImage);

module.exports = router
