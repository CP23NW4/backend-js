const express = require('express')
const router = express.Router()
const thailandController = require('../controllers/thailandController')

// ----------------- Route to get all Thailand data -----------------
router.get('/', thailandController.getAllThailandData)

module.exports = router
