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

// ----------------- Controller to get data by ID ---------------------------
const getThailandDataById = async (req, res) => {
  const thId = req.params.thId
  try {
    // Find data by ID in the Thailand collection
    const thailandData = await Thailand.findById(thId)
    if (thailandData) {
      res.json(thailandData)
      console.log(thailandData)
      console.log('---------------------------------------------')
    } else {
      res.status(404).json({ message: 'Data not found' })
      console.log('Data not found')
      console.log('---------------------------------------------')
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getAllThailandData,
  getThailandDataById,
}
