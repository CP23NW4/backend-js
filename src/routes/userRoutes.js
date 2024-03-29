// userRoutes.js file to define routes related to user authentication.
const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const multer = require('multer') // multer is a middleware to handle form-data
const upload = multer()

const User = require('../models/User')
const userController = require('../controllers/userController')
const loggedInUserService = require('../services/loggedInUserService')
const { authenticateUser } = require('../middlewares/userAuthMiddleware')

// Validation function to check if the username is unique
const isUsernameUnique = async (value) => {
  try {
    // Check if the username is unique
    const existingUser = await User.findOne({ username: value })
    if (existingUser) {
      return Promise.reject('Username already exists')
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject('Error checking username uniqueness')
  }
}

// Validation function to check if the email is unique
const isEmailUnique = async (value) => {
  try {
    // Check if the username is unique
    const existingEmail = await User.findOne({ email: value })
    if (existingEmail) {
      return Promise.reject('Email already exists')
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject('Error checking email uniqueness')
  }
}

// Validation function to check if the username is unique
const isPhoneNumberUnique = async (value) => {
  try {
    // Check if the phone number is unique
    const existingPhoneNumber = await User.findOne({ phoneNumber: value })
    if (existingPhoneNumber) {
      return Promise.reject('Phone number already exists')
    }

    // Check if the phone number follows the specified format
    const phoneNumberFormat = /^(09|06|08|02)\d{8}$/ // Phone number format
    if (!phoneNumberFormat.test(value)) {
      return Promise.reject(
        'Invalid phone number format. Must start with 02, 06, 08, or 09 and be 10 digits'
      )
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject('Error checking phone number uniqueness')
  }
}

// Validation function to check if the ID Card is unique
const isIdCardValidate = async (value) => {
  try {
    // Check if the ID card follows the specified format
    const idCardFormat = /^[1-8]\d{12}$/ // ID card format
    if (!idCardFormat.test(value)) {
      return Promise.reject(
        'Invalid ID card format. Must start with 1, 2, 3, 4, 5, 6, 7, or 8 and be 13 digits'
      )
    }

    // Check if the ID card number is unique
    const existingIdCard = await User.findOne({ idCard: value })
    if (existingIdCard) {
      return Promise.reject('ID card number already exists')
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject('Error checking ID card uniqueness and format')
  }
}

// Validation function to check if the user's age is at least 18 years
const isAgeValid = async (value) => {
  try {
    // Calculate the user's age based on the provided date of birth
    const currentDate = new Date()
    const dob = new Date(value)
    const age = currentDate.getFullYear() - dob.getFullYear()

    // Check if the age is at least 18 years
    if (age < 18) {
      return Promise.reject('You must be at least 18 years old to register')
    }

    return Promise.resolve()
  } catch (error) {
    return Promise.reject('Error checking age')
  }
}

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
      )
      .custom(isUsernameUnique), // Using the validation function

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
      )
      .custom(isEmailUnique), // Using the validation function

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
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be 10 digits')
      .custom(isPhoneNumberUnique), // Using the validation function

    // Validate DOB
    body('DOB')
      .notEmpty()
      .withMessage('Date of birth is required')
      .isISO8601()
      .withMessage('Invalid date of birth format')
      .custom(isAgeValid), // Using the custom validation function

    // Validate idCard
    body('idCard')
      .notEmpty()
      .withMessage('User ID card number is required')
      .isNumeric()
      .withMessage('ID card should contain only numbers')
      .isLength({ min: 13, max: 13 })
      .withMessage('ID card must be 13 digits')
      .custom(isIdCardValidate), // Using the validation function

    // Validate userPicture
    // body('userPicture').optional(),

    // Validate userAddress
    body('userAddress.PostCode')
      .notEmpty()
      .withMessage('Post code is required'),

    body('userAddress.TambonThaiShort')
      .notEmpty()
      .withMessage('Tam-bon is required'),

    body('userAddress.DistrictThaiShort')
      .notEmpty()
      .withMessage('District is required'),

    body('userAddress.ProvinceThai')
      .notEmpty()
      .withMessage('Province is required'),

    body('userAddress.homeAddress')
      .notEmpty()
      .withMessage('Home address is required')
      .isLength({ max: 100 })
      .withMessage(
        'User home address must be less than 100 characters'
      ),
  ],
  userController.registerUser
)

// ----------------- User login -----------------------------------------------
router.post('/login', upload.none(), userController.loginUser)

//----------------- Get all users ---------------------------------------------
router.get('/', authenticateUser, userController.getAllUsers)

// ----------------- Get user by ID -------------------------------------------
router.get('/:userId', authenticateUser, userController.getUserById)

// ----------------- Delete user by ID (Admin only) ----------------------------
router.delete('/:userId', authenticateUser, userController.deleteUserById)

// ----------------- Edit user by ID (Admin only) ------------------------------
router.put(
  '/:userId',
  upload.none(),
  authenticateUser,
  [
    // Validate username
    body('username')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage(
        'Username should contain only English letters, numbers, ".", and "_"'
      )
      .custom((value) => !/\s/.test(value))
      .withMessage('Username cannot contain whitespace')
      .isLength({ min: 5, max: 20 })
      .withMessage('Username must be between 5 and 20 characters')
      .custom(isUsernameUnique), // Using the validation function

    // Validate phoneNumber
    body('phoneNumber')
      .optional()
      .trim()
      .isNumeric()
      .withMessage('Phone number should contain only numbers')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be 10 digits')
      .custom(isPhoneNumberUnique), // Using the validation function

    // Validate idCard
    body('idCard')
      .optional()
      .isNumeric()
      .withMessage('ID card should contain only numbers')
      .isLength({ min: 13, max: 13 })
      .withMessage('ID card must be 13 digits')
      .custom(isIdCardValidate), // Using the validation function

    // Validate userAddress
    body('userAddress').optional(),
    body('userAddress.homeAddress')
      .notEmpty()
      .withMessage('Home address is required')
      .isLength({ max: 100 })
      .withMessage(
        'User home address must be less than 100 characters'
      ),
  ],

  userController.editUserById
)

// ----------------- Get logged-in user data ----------------------------------
router.get(
  '/user/info',
  authenticateUser,
  loggedInUserService.getLoggedInUserData
)

// ----------------- Edit logged-in user data ---------------------------------
router.put(
  '/',
  upload.none(),
  authenticateUser,
  [
    // Validate username
    body('username')
      .optional()
      .trim()
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage(
        'Username should contain only English letters, numbers, ".", and "_"'
      )
      .custom((value) => !/\s/.test(value))
      .withMessage('Username cannot contain whitespace')
      .isLength({ min: 5, max: 20 })
      .withMessage('Username must be between 5 and 20 characters')
      .custom(isUsernameUnique), // Using the validation function

    // Validate phoneNumber
    body('phoneNumber')
      .optional()
      .trim()
      .isNumeric()
      .withMessage('Phone number should contain only numbers')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be 10 digits')
      .custom(isPhoneNumberUnique), // Using the validation function

    // Validate idCard
    body('idCard')
      .optional()
      .isNumeric()
      .withMessage('ID card should contain only numbers')
      .isLength({ min: 13, max: 13 })
      .withMessage('ID card must be 13 digits')
      .custom(isIdCardValidate), // Using the validation function

    // Validate userAddress
    body('userAddress').optional(),
    body('userAddress.homeAddress')
      .notEmpty()
      .withMessage('Home address is required')
      .isLength({ max: 100 })
      .withMessage(
        'User home address must be less than 100 characters'
      ),
  ],
  userController.editLoggedInUser
)

// ----------------- Delete logged-in user data -------------------------------
router.delete('/', authenticateUser, userController.deleteLoggedInUser)


// ----------------- Email verification ---------------------------------------
router.get('/verify/:token', userController.verifyUser)


module.exports = router
