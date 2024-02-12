// strayAnimalRoutes.js for defining the routes related to stray animals.

const express = require('express')
const { request, response } = require("express");
const { body, validationResult } = require('express-validator')
const { StrayAnimal } = require('../models/StrayAnimal')
const strayAnimalController = require('../controllers/strayAnimalController')
const { authenticateUser } = require('../middlewares/userAuthMiddleware');
const { User } = require('../models/User')

const router = express.Router()

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 11 * 1024 * 1024 } // 11MB limit
}); // create an instance of multer

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
//Read
router.get("/UserStrayAnimal", async (request, response) => {
  try {
    const result = await StrayAnimal.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ]);
    response.json(result);
  } catch (error){
    console.error("Error fetching user and strayAnimal:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
})

// Read by ID
router.get("/UserStrayAnimal/:id", async (request, response) => {
  try {
    const userId = request.params.id;

    const result = await StrayAnimal.aggregate([
      {
        $match: {
          userID: mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ]);

    response.json(result);
  } catch (error) {
    console.error("Error fetching user and strayAnimal:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// --------------------------------------------------------------

// const multer = require('multer'); // Assuming you use multer for file uploads

// const upload = multer(); // Set up multer middleware for handling multipart/form-data

// router.post('/upload-image', upload.single('picture'), strayAnimalController.uploadImage);
// Route to get an image by file name
// router.get('/get-image/:containerName:fileName', strayAnimalController.getImage);

module.exports = router;
