// userRoutes.js file to define routes related to user authentication.
const express = require('express')
const router = express.Router()
const { body, oneOf } = require('express-validator')
const multer = require('multer') // multer is a middleware to handle form-data
const upload = multer()

const userController = require('../controllers/userController')
const loggedInUserService = require('../services/loggedInUserService')
const { authenticateUser } = require('../middlewares/userAuthMiddleware')

// ----------------- User registration ------------------------------------------
router.post(
  '/register',
  // upload.none(),
  upload.single('userPicture'),
  [
    // Validate name
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim()
      .matches(/^[\u0E01-\u0E5B]+( [\u0E01-\u0E5B]+)*$/)
      .withMessage(
        'Name should be in Thai language only with whitespace in the middle'
      )
      .isLength({ min: 5, max: 100 })
      .withMessage(
        'Name must be more than 5 and less than or equal to 100 characters'
      ),

    // Validate username
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .trim()
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage(
        'Username should contain only English letters, numbers, ".", and "_"'
      )
      .custom((value) => !/\s/.test(value))
      .withMessage('Username cannot contain whitespace')
      .isLength({ min: 5, max: 20 })
      .withMessage(
        'Username must be more than 5 and less than or equal to 20 characters'
      ),

    // Validate email
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .isLength({ min: 5, max: 50 })
      .withMessage(
        'Email must be more than 5 and less than or equal to 50 characters'
      ),

    // Validate password
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 9, max: 20 })
      .withMessage(
        'Password must be more than 9 and less than or equal to 20 characters'
      )
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      .withMessage(
        'Password must contain at least one letter, one number, and one special character'
      ),

    // Validate phoneNumber
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .trim()
      .isNumeric()
      .withMessage('Phone number should contain only numbers')
      .custom((value) => /^(09|06|08)\d{8}$/.test(value))
      .withMessage('Invalid phone number format')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be 10 digits'),

    // Validate idCard
    body('idCard')
      .notEmpty()
      .withMessage('User ID card number is required')
      .isNumeric()
      .withMessage('ID card should contain only numbers')
      .isLength({ min: 13, max: 13 })
      .withMessage('ID card must be 13 digits'),

    // Validate userPicture
    // body('userPicture').optional(),
 
    body('homePicture').optional(),
    body('userAddress').optional(),
    // .trim()
    // .notEmpty()
    // .withMessage('User address is required')
    // .matches(/^[\u0020-\u007E\u0E00-\u0E7F0-9\s]{5,200}$/)
    // .withMessage(
    //   'User address can contain Thai and English characters, whitespace, numbers, and special characters, with a length between 5 and 200 characters'
    // ),
  ],
  userController.registerUser
)

// ----------------- User login -----------------------------------------------
router.post('/login', userController.loginUser)

//----------------- Get all users ---------------------------------------------
router.get('/all', authenticateUser, userController.getAllUsers)

// ----------------- Get user by ID -------------------------------------------
router.get('/:userId', authenticateUser, userController.getUserById)

// ----------------- Delete user by ID (Admin only) ----------------------------
router.delete('/:userId', authenticateUser, userController.deleteUserById)

// ----------------- Edit user by ID (Admin only) ------------------------------
router.put('/:userId', authenticateUser, userController.editUserById)

// ----------------- Get logged-in user data ----------------------------------
router.get('/', authenticateUser, loggedInUserService.getLoggedInUserData)

// ----------------- Edit logged-in user data ---------------------------------
router.put('/', authenticateUser, userController.editLoggedInUser)

// ----------------- Delete logged-in user data -------------------------------
router.delete('/', authenticateUser, userController.deleteLoggedInUser)

module.exports = router
