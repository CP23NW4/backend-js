// strayAnimalRoutes.js for defining the routes related to stray animals.
const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const multer = require('multer') // multer is a middleware to handle form-data
const upload = multer()

const strayAnimalController = require('../controllers/strayAnimalController')
const { authenticateUser } = require('../middlewares/userAuthMiddleware')

// const { getDogStrayAnimals } = require('./controllers/strayAnimalController')

// ----------------- Get all stray animals ----------------------------------------------
router.get('/all', strayAnimalController.getAllStrayAnimals)

// ----------------- Get stray animal by ID ---------------------------------------------
router.get('/:saId', strayAnimalController.getStrayAnimalById)

// ----------------- Get stray animal filter by type Dog ---------------------------------
router.get('/all/dog', strayAnimalController.getAllStrayAnimalDogs)

// ----------------- Get stray animal filter by type Cat ---------------------------------
router.get('/all/cat', strayAnimalController.getAllStrayAnimalCats)

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
    body('type').optional().isIn(['Dog', 'Cat']).isLength({ max: 5 }),
    body('gender').optional().isIn(['Male', 'Female']).isLength({ max: 6 }),
    body('color')
      .optional()
      .matches(/^[\u0E00-\u0E7F\sA-Za-z]+$/)
      .custom((value) => !/\d/.test(value)),
    body('description').optional().isLength({ max: 500 }),
    body('status')
      .optional()
      .isLength({ max: 11 })
      .withMessage('Status must be less than 11 characters')
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
    .isLength({ max: 500 })
    .withMessage('Note must be less than 500 characters'),
  body('contact')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Contact must be less than 20 characters'),
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary should contain only numbers'),
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

// // ----------------- GET adoption requests by owners (Receiver) ------------
// router.get(
//   '/receiver/reqAdoption',
//   authenticateUser,
//   strayAnimalController.getOwnersAdoptionRequestsByLoggedInUser
// )

// ----------------- Get adoption requests filter by ID stray animal post ---------------------
router.get(
  '/receiver/:saId/reqAdoption',
  authenticateUser,
  strayAnimalController.getAdoptionRequestsBysaId
)

// ----------------- Edit status adoption request by ID (Receiver) -------------------------------------
router.put(
  '/receiver/reqAdoption/:reqId',
  upload.none(),
  body('status')
  .isLength({ max: 10 })
  .withMessage('Status must be less than 10 characters')
  .optional()
  .isIn(['On Request', 'Accepted', 'Rejected'])
  .withMessage('Status must be On Request, Accepted or Rejected'), 
  authenticateUser, 
  strayAnimalController.updateAdoptionRequestStatus)


// // ----------------- GET adoption requests form (Receiver) by ID --------------------------
// router.get(
//   '/receiver/reqAdoption/:reqId',
//   authenticateUser,
//   strayAnimalController.getAdoptionRequestById
// )

// ----------------- GET adoption requests form (Sender) by ID --------------------------
router.get(
  '/sender/reqAdoption/:reqId',
  authenticateUser,
  strayAnimalController.getAdoptionRequestByIdForSender
)

// ----------------- Create comments  --------------------------
router.post(
  '/:saId/comment',
  upload.none(),
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

// ----------------- Get posts of stray animals filter by Unavailable (Adopted) --------------------------
router.get('/all/adopted', strayAnimalController.getAdoptedStrayAnimals)

module.exports = router
