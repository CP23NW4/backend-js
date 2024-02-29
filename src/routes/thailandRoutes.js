const express = require('express');
const router = express.Router();
const thailandController = require('../controllers/thailandController');

// ----------------- Route to get all Thailand data -----------------
router.get('/', thailandController.getAllThailandData);

// ----------------- Route to get Thailand data by ID -----------------
router.get('/:thId', thailandController.getThailandDataById);

module.exports = router;