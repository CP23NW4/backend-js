// Import the Thailand model
require('dotenv').config({ path: '../.env' })

const Thailand = require('../models/Thailand')

// ----------------- Controller to get all data -----------------------------
const getAllThailandData = async (req, res) => {
  try {
    // Fetch all data from the Thailand collection
    const thailandData = await Thailand.find()
    res.json(thailandData)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getAllThailandData,
}
