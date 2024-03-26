// strayAnimalRoutes.js for defining the routes related to stray animals.
const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const multer = require('multer') // multer is a middleware to handle form-data
const upload = multer()

const strayAnimalController = require('../controllers/strayAnimalController')
const { authenticateUser } = require('../middlewares/userAuthMiddleware')

// ----------------- Get all stray animals ----------------------------------------------
router.get('/all', strayAnimalController.getAllStrayAnimals)

// ----------------- Get stray animal by ID ---------------------------------------------
router.get('/:saId', strayAnimalController.getStrayAnimalById)

// ----------------- Create stray animal post ------------------------------------------------
router.post(
  '/',
  upload.single('picture'),
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 1, max: 20 })
      .matches(/^[\u0E00-\u0E7F\sA-Za-z0-9]+$/),
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['Dog', 'Cat'])
      .isLength({ max: 5 }),
    body('gender')
      .notEmpty()
      .withMessage('Gender is required')
      .isIn(['Male', 'Female'])
      .isLength({ max: 6 }),
    body('color')
      .notEmpty()
      .withMessage('Color is required')
      .matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/),
    body('description').isLength({ max: 500 }),
    // Custom validation for 'picture' field
    body('picture').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Picture is required.')
      }
      return true
    }),
  ],
  authenticateUser,
  strayAnimalController.createStrayAnimal
)

// ----------------- Edit animal by ID -----------------------------------------------
router.put(
  '/:saId',
  upload.none(),
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
    body('status')
      .isLength({ max: 11 })
      .withMessage('Status must be less than 11 characters')
      .optional()
      .isIn(['Available', 'Unavailable'])
      .withMessage('Status must be Available or Unavailable'),
  ],
  authenticateUser,
  strayAnimalController.updateStrayAnimal
)

// ----------------- Delete animal by ID -------------------------------------------
router.delete(
  '/:saId',
  authenticateUser,
  strayAnimalController.deleteStrayAnimal
)

// ----------------- Create adoption requests by ID ---------------------
router.post(
  '/:saId/reqAdoption',
  // upload.none(),
  upload.single('homePicture'),
  body('note')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Note must be less than 500 characters'),
  authenticateUser,
  strayAnimalController.requestAdoption
)

// ----------------- Get all animals by logged-in user ------------------------------
router.get(
  '/',
  authenticateUser,
  strayAnimalController.getAnimalPostsByLoggedInUser
)

// ----------------- GET adoption requests by logged-in user (Sender) ------------
router.get(
  '/sender/reqAdoption',
  authenticateUser,
  strayAnimalController.getAdoptionRequestsByLoggedInUser
)

// ----------------- GET adoption requests by owners (Reciever) ------------
router.get(
  '/reciever/reqAdoption',
  authenticateUser,
  strayAnimalController.getOwnersAdoptionRequestsByLoggedInUser
)

// ----------------- Get adoption requests filter by ID stray animal post ---------------------
router.get(
  '/reciever/:saId/reqAdoption',
  authenticateUser,
  strayAnimalController.getAdoptionRequestsBysaId
)

// ----------------- Edit status adoption request by ID (Reciever) -------------------------------------
router.put(
  '/reciever/reqAdoption/:reqId',
  upload.none(),
  body('status')
  .isLength({ max: 10 })
  .withMessage('Status must be less than 10 characters')
  .optional()
  .isIn(['On Request', 'Accepted'])
  .withMessage('Status must be On Request or Accepted'), 
  authenticateUser, 
  strayAnimalController.updateAdoptionRequestStatus)


// ----------------- GET adoption requests form (Reciever) by ID --------------------------
router.get(
  '/reciever/reqAdoption/:reqId',
  authenticateUser,
  strayAnimalController.getAdoptionRequestById
)

// ----------------- Create comments  --------------------------
router.post(
  '/:saId/comment',
  body('comment')
  .notEmpty()
  .isLength({ max: 200 })
  .withMessage('Comment must be less than 200 characters'),
  authenticateUser,
  strayAnimalController.createComment
)

// ----------------- GET comments by ID --------------------------
router.get(
  '/:saId/comments',
  strayAnimalController.getComments
)

// ----------------- Edit comment by ID -------------------------- 
// router.put(
//   '/:saId/comment/:commentId',
//   body('text')
//   .optional()
//   .isLength({ max: 200 })
//   .withMessage('Comment must be less than 200 characters'),
//   authenticateUser,
//   strayAnimalController.updateComment
// )

// ----------------- Delete comment by ID --------------------------
router.delete(
  '/:saId/comment/:commentId',
  authenticateUser,
  strayAnimalController.deleteComment
)


module.exports = router
