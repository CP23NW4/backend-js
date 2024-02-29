const express = require('express');
const router = express.Router();
const thailandController = require('../controllers/thailandController');

// Route to get all Thailand data
router.get('/', thailandController.getAllThailandData);

// Route to get Thailand data by ID
router.get('/:thId', thailandController.getThailandDataById);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Thailand = require('../models/Thailand');

// // Route to get all Thailand data
// router.get('/', async (req, res) => {
//     try {
//         const thailandData = await Thailand.find();
//         res.json(thailandData);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// module.exports = router;
